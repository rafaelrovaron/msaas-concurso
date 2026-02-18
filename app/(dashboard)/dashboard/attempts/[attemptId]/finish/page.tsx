import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AttemptFinishPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Carrega attempt e valida dono
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, exam_id, materia, finished_at, score, passed')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptError || !attempt) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Tentativa nao encontrada.</p>
        <Link href="/dashboard/exams" className="text-sm text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (attempt.user_id !== user.id) redirect('/dashboard/exams')

  // Carrega exam (titulo)
  const { data: exam } = await supabase
    .from('exams')
    .select('concurso, banca, ano')
    .eq('id', attempt.exam_id)
    .maybeSingle()

  const examTitle = exam ? `${exam.concurso} • ${exam.banca} • ${exam.ano}` : 'Prova'

  // Total de questoes dessa tentativa (considerando materia)
  let totalQ = supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', attempt.exam_id)

  if (attempt.materia) totalQ = totalQ.eq('materia', attempt.materia)

  const { count: totalQuestions } = await totalQ

  // Total respondidas
  const { count: answeredCount } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)

  // Total corretas
  const { count: correctCount } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)
    .eq('correta', true)

  const total = totalQuestions ?? 0
  const answered = answeredCount ?? 0
  const correct = correctCount ?? 0
  const unanswered = Math.max(0, total - answered)
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  const minPercentToPass = 70
  const passed = total > 0 ? percent >= minPercentToPass : null

  // Finaliza attempt se ainda nao finalizado
  if (!attempt.finished_at) {
    await supabase
      .from('attempts')
      .update({
        score: correct,
        passed: passed === null ? null : passed,
        finished_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-sm text-gray-500">{examTitle}</div>

        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          Prova finalizada ?
        </h1>

        {attempt.materia && (
          <p className="mt-2 text-sm text-gray-600">
            Modo: <span className="font-medium">{attempt.materia}</span>
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Score</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              {correct}/{total} ({percent}%)
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Respondidas</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              {answered}/{total}
            </div>
            {unanswered > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                Nao respondidas: <span className="font-medium">{unanswered}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2">
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1 text-base text-gray-900">
              {total === 0 ? (
                <span className="text-gray-600">Sem questoes para avaliar</span>
              ) : passed ? (
                <span className="font-medium text-green-700">
                  ✅ Aprovado ({percent}% de acerto)
                </span>
              ) : (
                <span className="font-medium text-red-700">
                  ❌ Abaixo do corte ({percent}% de acerto)
                </span>
              )}
            </div>
            {total > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                Minimo para aprovacao: {minPercentToPass}%.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/dashboard/attempts/${attemptId}/review`}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Ver revisao (gabarito)
          </Link>

          <Link
            href="/dashboard/exams"
            className="inline-flex justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition"
          >
            Voltar para provas
          </Link>
        </div>
      </div>
    </div>
  )
}
