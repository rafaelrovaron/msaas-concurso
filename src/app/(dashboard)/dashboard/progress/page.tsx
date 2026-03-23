import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type MateriaStats = {
  discipline: string
  total: number
  correct: number
  percent: number
}

type AnswerWithQuestion = {
  correta: boolean | null
  question:
    | {
        discipline: string | null
      }
    | {
        discipline: string | null
      }[]
    | null
}

type ExamRelation =
  | {
      concurso: string
      banca: string
      ano: number
    }
  | {
      concurso: string
      banca: string
      ano: number
    }[]
  | null

type RecentAttemptRow = {
  id: string
  score: number | null
  passed: boolean | null
  finished_at: string | null
  discipline: string | null
  mode: 'full_exam' | 'custom'
  exam: ExamRelation
}

type RecentAttempt = {
  id: string
  score: number | null
  passed: boolean | null
  finished_at: string | null
  discipline: string | null
  mode: 'full_exam' | 'custom'
  exam: {
    concurso: string
    banca: string
    ano: number
  } | null
}

function normalizeQuestionRelation(question: AnswerWithQuestion['question']) {
  if (!question) return null
  return Array.isArray(question) ? question[0] ?? null : question
}

function normalizeExamRelation(exam: ExamRelation) {
  if (!exam) return null
  return Array.isArray(exam) ? exam[0] ?? null : exam
}

function getAttemptTitle(attempt: RecentAttempt) {
  if (attempt.mode === 'custom' || !attempt.exam) {
    return 'Prova personalizada'
  }

  return `${attempt.exam.concurso} • ${attempt.exam.banca} • ${attempt.exam.ano}`
}

export default async function ProgressPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: attempts } = await supabase.from('attempts').select('id').eq('user_id', user.id)
  const attemptIds = (attempts ?? []).map((attempt) => attempt.id)

  if (attemptIds.length === 0) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold text-gray-900">Meu progresso</h1>
          <p className="mt-2 text-sm text-gray-600">Você ainda não iniciou nenhuma prova.</p>
          <Link
            href="/dashboard/exams"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Ir para provas
          </Link>
        </div>
      </div>
    )
  }

  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('correta, question:questions(discipline)')
    .in('attempt_id', attemptIds)

  if (answersError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Erro ao carregar progresso: {answersError.message}
        </p>
      </div>
    )
  }

  const typedAnswers = (answers ?? []) as unknown as AnswerWithQuestion[]
  const totalAnswered = typedAnswers.length
  const totalCorrect = typedAnswers.filter((answer) => answer.correta === true).length
  const overallPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  const statsMap = new Map<string, { total: number; correct: number }>()

  for (const row of typedAnswers) {
    const discipline = normalizeQuestionRelation(row.question)?.discipline ?? 'Sem disciplina'
    const previous = statsMap.get(discipline) ?? { total: 0, correct: 0 }

    previous.total += 1
    if (row.correta === true) {
      previous.correct += 1
    }

    statsMap.set(discipline, previous)
  }

  const disciplineStats: MateriaStats[] = Array.from(statsMap.entries())
    .map(([discipline, values]) => ({
      discipline,
      total: values.total,
      correct: values.correct,
      percent: values.total > 0 ? Math.round((values.correct / values.total) * 100) : 0,
    }))
    .sort((first, second) => second.percent - first.percent)

  const { data: recentAttemptsData } = await supabase
    .from('attempts')
    .select('id, score, passed, finished_at, discipline, mode, exam:exams(concurso,banca,ano)')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(10)

  const recentAttempts: RecentAttempt[] = ((recentAttemptsData ?? []) as RecentAttemptRow[]).map(
    (attempt) => ({
      ...attempt,
      exam: normalizeExamRelation(attempt.exam),
    })
  )

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">Meu progresso</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhe seu desempenho geral e por disciplina.
        </p>

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

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Por disciplina</h2>
          <div className="mt-4 space-y-3">
            {disciplineStats.map((item) => (
              <div key={item.discipline} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {item.discipline}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.correct}/{item.total} acertos
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-blue-600" style={{ width: `${item.percent}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-900">
                    {item.percent}%
                  </div>
                </div>
              </div>
            ))}

            {disciplineStats.length === 0 && (
              <p className="text-sm text-gray-600">Sem dados suficientes ainda.</p>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tentativas recentes</h2>

          <div className="mt-4 space-y-3">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {getAttemptTitle(attempt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {attempt.mode === 'custom' ? 'Prova personalizada' : 'Prova completa'}
                    {attempt.discipline ? ` • Disciplina: ${attempt.discipline}` : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-sm text-gray-700">
                    Score: <span className="font-medium">{attempt.score ?? 0}</span>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      attempt.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {attempt.passed ? 'Aprovado' : 'Abaixo do corte'}
                  </div>

                  <Link
                    href={`/dashboard/attempts/${attempt.id}/review`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            ))}

            {recentAttempts.length === 0 && (
              <p className="text-sm text-gray-600">Nenhuma tentativa finalizada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
