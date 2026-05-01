import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AnswerRow, AttemptQuestionRow, AttemptRow, ExamRow, QuestionRow } from '@/lib/types'

type DisciplineStats = {
  correct: number
  discipline: string
  percent: number
  total: number
}

type RecentAttempt = Pick<
  AttemptRow,
  'discipline' | 'finished_at' | 'id' | 'mode' | 'passed' | 'score'
> & {
  exam: Pick<ExamRow, 'ano' | 'banca' | 'concurso'> | null
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

  const { data: allAttempts } = await supabase.from('attempts').select('id').eq('user_id', user.id)
  const { data: finishedAttemptsData, error: finishedAttemptsError } = await supabase
    .from('attempts')
    .select('id, score, passed, finished_at, discipline, mode, exam_id')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(10)

  if (finishedAttemptsError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Erro ao carregar progresso: {finishedAttemptsError.message}
        </p>
      </div>
    )
  }

  const totalAttempts = allAttempts?.length ?? 0
  const finishedAttempts = finishedAttemptsData ?? []
  const finishedAttemptIds = finishedAttempts.map((attempt) => attempt.id)

  if (totalAttempts === 0) {
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

  if (finishedAttemptIds.length === 0) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold text-gray-900">Meu progresso</h1>
          <p className="mt-1 text-sm text-gray-500">
            Finalize uma prova para começar a acompanhar desempenho consolidado.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Tentativas criadas</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{totalAttempts}</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Finalizadas</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">0</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">% de acerto</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">0%</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { data: attemptQuestionsData, error: attemptQuestionsError } = await supabase
    .from('attempt_questions')
    .select('attempt_id, question_id')
    .in('attempt_id', finishedAttemptIds)

  if (attemptQuestionsError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Erro ao carregar progresso: {attemptQuestionsError.message}
        </p>
      </div>
    )
  }

  const attemptQuestions = (attemptQuestionsData ?? []) as Pick<
    AttemptQuestionRow,
    'attempt_id' | 'question_id'
  >[]
  const questionIds = Array.from(new Set(attemptQuestions.map((row) => row.question_id)))

  const [{ data: answersData, error: answersError }, { data: questionsData, error: questionsError }] =
    await Promise.all([
      supabase
        .from('answers')
        .select('attempt_id, question_id, correta')
        .in('attempt_id', finishedAttemptIds),
      questionIds.length > 0
        ? supabase.from('questions').select('id, discipline').in('id', questionIds)
        : Promise.resolve({ data: [], error: null }),
    ])

  if (answersError || questionsError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Erro ao carregar progresso: {answersError?.message ?? questionsError?.message}
        </p>
      </div>
    )
  }

  const answers = (answersData ?? []) as Pick<AnswerRow, 'attempt_id' | 'correta' | 'question_id'>[]
  const questions = (questionsData ?? []) as Pick<QuestionRow, 'discipline' | 'id'>[]
  const questionDisciplineMap = new Map(questions.map((question) => [question.id, question.discipline]))
  const correctAnswerKeys = new Set(
    answers
      .filter((answer) => answer.correta === true)
      .map((answer) => `${answer.attempt_id}:${answer.question_id}`)
  )

  const statsMap = new Map<string, { correct: number; total: number }>()
  let totalQuestions = 0
  let totalCorrect = 0

  for (const row of attemptQuestions) {
    totalQuestions += 1

    const discipline = questionDisciplineMap.get(row.question_id) ?? 'Sem disciplina'
    const previous = statsMap.get(discipline) ?? { correct: 0, total: 0 }

    previous.total += 1

    if (correctAnswerKeys.has(`${row.attempt_id}:${row.question_id}`)) {
      previous.correct += 1
      totalCorrect += 1
    }

    statsMap.set(discipline, previous)
  }

  const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const disciplineStats: DisciplineStats[] = Array.from(statsMap.entries())
    .map(([discipline, values]) => ({
      correct: values.correct,
      discipline,
      percent: values.total > 0 ? Math.round((values.correct / values.total) * 100) : 0,
      total: values.total,
    }))
    .sort((first, second) => second.percent - first.percent)

  const examIds = Array.from(
    new Set(finishedAttempts.map((attempt) => attempt.exam_id).filter((examId): examId is string => Boolean(examId)))
  )
  const { data: examsData } = examIds.length > 0
    ? await supabase.from('exams').select('id, concurso, banca, ano').in('id', examIds)
    : { data: [] }
  const examsMap = new Map(
    (examsData ?? []).map((exam) => [exam.id, { ano: exam.ano, banca: exam.banca, concurso: exam.concurso }])
  )

  const recentAttempts: RecentAttempt[] = finishedAttempts.map((attempt) => ({
    discipline: attempt.discipline,
    exam: attempt.exam_id ? examsMap.get(attempt.exam_id) ?? null : null,
    finished_at: attempt.finished_at,
    id: attempt.id,
    mode: attempt.mode,
    passed: attempt.passed,
    score: attempt.score,
  }))

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900">Meu progresso</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhe seu desempenho em provas finalizadas, incluindo questões não respondidas como erros.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Questões avaliadas</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{totalQuestions}</div>
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
                  <div className="truncate text-sm font-medium text-gray-900">{item.discipline}</div>
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
