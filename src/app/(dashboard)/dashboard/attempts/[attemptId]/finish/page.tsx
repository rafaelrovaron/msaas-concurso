import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ATTEMPT_PASS_PERCENTAGE, getAttemptSummary } from '@/lib/attempts'
import { createClient } from '@/lib/supabase/server'

type AttemptFilters = {
  discipline?: string | null
  topic?: string | null
  banca?: string | null
  year?: number | null
}

function buildAttemptTitle({
  mode,
  exam,
}: {
  mode: 'full_exam' | 'custom'
  exam: { concurso: string; banca: string; ano: number } | null
}) {
  if (mode === 'custom' || !exam) {
    return 'Prova personalizada'
  }

  return `${exam.concurso} • ${exam.banca} • ${exam.ano}`
}

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

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, exam_id, discipline, mode, filters, finished_at')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptError || !attempt) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Tentativa não encontrada.</p>
        <Link href="/dashboard/exams" className="text-sm text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (attempt.user_id !== user.id) redirect('/dashboard/exams')
  if (!attempt.finished_at) redirect(`/dashboard/attempts/${attemptId}`)

  const exam = attempt.exam_id
    ? (
        await supabase
          .from('exams')
          .select('concurso, banca, ano')
          .eq('id', attempt.exam_id)
          .maybeSingle()
      ).data ?? null
    : null

  const summary = await getAttemptSummary({ supabase, attemptId })
  const filters = (attempt.filters ?? {}) as AttemptFilters

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-sm text-gray-500">
          {buildAttemptTitle({ mode: attempt.mode, exam })}
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Prova finalizada</h1>

        <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
          <span className="rounded-full bg-gray-100 px-3 py-1">
            Modo: {attempt.mode === 'full_exam' ? 'Prova completa' : 'Personalizada'}
          </span>
          {attempt.discipline && (
            <span className="rounded-full bg-gray-100 px-3 py-1">
              Disciplina: {attempt.discipline}
            </span>
          )}
          {filters.topic && (
            <span className="rounded-full bg-gray-100 px-3 py-1">Assunto: {filters.topic}</span>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Score</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              {summary.correct}/{summary.total} ({summary.percent}%)
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Respondidas</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              {summary.answered}/{summary.total}
            </div>
            {summary.unanswered > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                Não respondidas: <span className="font-medium">{summary.unanswered}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2">
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1 text-base text-gray-900">
              {summary.total === 0 ? (
                <span className="text-gray-600">Sem questões para avaliar</span>
              ) : summary.passed ? (
                <span className="font-medium text-green-700">
                  Aprovado ({summary.percent}% de acerto)
                </span>
              ) : (
                <span className="font-medium text-red-700">
                  Abaixo do corte ({summary.percent}% de acerto)
                </span>
              )}
            </div>
            {summary.total > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                Mínimo para aprovação: {ATTEMPT_PASS_PERCENTAGE}%.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/dashboard/attempts/${attemptId}/review`}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Ver revisão
          </Link>

          <Link
            href="/dashboard/exams"
            className="inline-flex justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Voltar para provas
          </Link>
        </div>
      </div>
    </div>
  )
}
