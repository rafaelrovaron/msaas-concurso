import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type MateriaStats = {
  materia: string
  total: number
  correct: number
  percent: number
}

export default async function ProgressPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1) buscar answers do usuário (via join attempts)
  // Pegamos attempts do usuário e então answers desses attempts.
  const { data: attempts } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', user.id)

  const attemptIds = (attempts ?? []).map((a) => a.id)

  if (attemptIds.length === 0) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold text-gray-900">Meu Progresso</h1>
          <p className="mt-2 text-sm text-gray-600">
            Você ainda não iniciou nenhuma prova.
          </p>
          <Link href="/dashboard/exams" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Ir para provas
          </Link>
        </div>
      </div>
    )
  }

  // answers + join em questions(materia)
  const { data: answers, error: ansErr } = await supabase
    .from('answers')
    .select('correta, question:questions(materia)')
    .in('attempt_id', attemptIds)

  if (ansErr) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Erro ao carregar progresso: {ansErr.message}</p>
      </div>
    )
  }

  const totalAnswered = answers?.length ?? 0
  const totalCorrect = (answers ?? []).filter((a: any) => a.correta === true).length
  const overallPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  // Agregar por matéria
  const map = new Map<string, { total: number; correct: number }>()
  for (const row of answers ?? []) {
    const materia = (row as any).question?.materia ?? 'Sem matéria'
    const prev = map.get(materia) ?? { total: 0, correct: 0 }
    prev.total += 1
    if ((row as any).correta === true) prev.correct += 1
    map.set(materia, prev)
  }

  const materiaStats: MateriaStats[] = Array.from(map.entries()).map(([materia, v]) => ({
    materia,
    total: v.total,
    correct: v.correct,
    percent: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
  })).sort((a, b) => b.percent - a.percent)

  // Tentativas recentes
  const { data: recentAttempts } = await supabase
    .from('attempts')
    .select('id, score, passed, finished_at, materia, exam:exams(concurso,banca,ano)')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">Meu Progresso</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhe seu desempenho geral e por matéria.
        </p>

        {/* Cards gerais */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Respondidas</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{totalAnswered}</div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Acertos</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{totalCorrect}</div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">% de acerto</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{overallPercent}%</div>
          </div>
        </div>

        {/* Por matéria */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Por matéria</h2>
          <div className="mt-4 space-y-3">
            {materiaStats.map((m) => (
              <div key={m.materia} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{m.materia}</div>
                  <div className="text-xs text-gray-500">
                    {m.correct}/{m.total} acertos
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-40 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-900">
                    {m.percent}%
                  </div>
                </div>
              </div>
            ))}

            {materiaStats.length === 0 && (
              <p className="text-sm text-gray-600">Sem dados suficientes ainda.</p>
            )}
          </div>
        </div>

        {/* Tentativas recentes */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tentativas recentes</h2>

          <div className="mt-4 space-y-3">
            {(recentAttempts ?? []).map((a: any) => {
              const exam = a.exam
              const title = exam ? `${exam.concurso} • ${exam.banca} • ${exam.ano}` : 'Prova'
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{title}</div>
                    <div className="text-xs text-gray-500">
                      {a.materia ? `Matéria: ${a.materia}` : 'Prova completa'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-sm text-gray-700">
                      Score: <span className="font-medium">{a.score ?? 0}</span>
                    </div>
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        a.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {a.passed ? 'Aprovado' : 'Abaixo do corte'}
                    </div>

                    <Link
                      href={`/dashboard/attempts/${a.id}/review`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Revisar
                    </Link>
                  </div>
                </div>
              )
            })}

            {(recentAttempts ?? []).length === 0 && (
              <p className="text-sm text-gray-600">Nenhuma tentativa finalizada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
