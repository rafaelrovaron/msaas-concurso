import type { SupabaseClient } from '@supabase/supabase-js'

export const ATTEMPT_PASS_PERCENTAGE = 70

export type AttemptMode = 'full_exam' | 'custom'

export type AttemptQuestion = {
  id: string
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  correta: 'A' | 'B' | 'C' | 'D' | 'E'
  discipline: string | null
  topic: string | null
}

type CreateAttemptParams = {
  supabase: SupabaseClient
  userId: string
  mode: AttemptMode
  questionIds: string[]
  examId?: string | null
  discipline?: string | null
  filters?: Record<string, string | number | null>
}

type CreateAttemptResult = {
  id: string
}

type AttemptSummary = {
  total: number
  answered: number
  correct: number
  unanswered: number
  percent: number
  passed: boolean | null
}

const ATTEMPT_QUESTION_SELECT =
  'id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, correta, discipline, topic'

function shuffle<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function normalizeQuestion(raw: AttemptQuestion | AttemptQuestion[] | null) {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export async function createAttemptWithQuestions({
  supabase,
  userId,
  mode,
  questionIds,
  examId = null,
  discipline = null,
  filters = {},
}: CreateAttemptParams): Promise<CreateAttemptResult> {
  if (questionIds.length === 0) {
    throw new Error('Nenhuma questão encontrada para criar a tentativa.')
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .insert({
      user_id: userId,
      exam_id: examId,
      mode,
      discipline,
      filters,
    })
    .select('id')
    .single()

  if (attemptError || !attempt) {
    throw new Error(attemptError?.message ?? 'Não foi possível criar a tentativa.')
  }

  const { error: attemptQuestionsError } = await supabase
    .from('attempt_questions')
    .insert(
      questionIds.map((questionId, index) => ({
        attempt_id: attempt.id,
        question_id: questionId,
        position: index + 1,
      }))
    )

  if (attemptQuestionsError) {
    throw new Error(attemptQuestionsError.message)
  }

  return attempt
}

export async function createFullExamAttempt({
  supabase,
  userId,
  examId,
}: {
  supabase: SupabaseClient
  userId: string
  examId: string
}) {
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id')
    .eq('exam_id', examId)
    .order('id', { ascending: true })

  if (questionsError) {
    throw new Error(questionsError.message)
  }

  return createAttemptWithQuestions({
    supabase,
    userId,
    mode: 'full_exam',
    examId,
    questionIds: (questions ?? []).map((question) => question.id),
    filters: {
      examId,
    },
  })
}

export async function createCustomAttempt({
  supabase,
  userId,
  discipline,
  topic,
  banca,
  year,
  questionCount,
}: {
  supabase: SupabaseClient
  userId: string
  discipline: string
  topic: string | null
  banca: string | null
  year: number | null
  questionCount: number
}) {
  if (!discipline) {
    throw new Error('Selecione uma disciplina para gerar a prova.')
  }

  let eligibleExamIds: string[] | null = null

  if (banca || year) {
    let examsQuery = supabase.from('exams').select('id')

    if (banca) {
      examsQuery = examsQuery.eq('banca', banca)
    }

    if (year) {
      examsQuery = examsQuery.eq('ano', year)
    }

    const { data: exams, error: examsError } = await examsQuery

    if (examsError) {
      throw new Error(examsError.message)
    }

    eligibleExamIds = (exams ?? []).map((exam) => exam.id)

    if (eligibleExamIds.length === 0) {
      throw new Error('Nenhuma prova encontrada com os filtros selecionados.')
    }
  }

  let questionsQuery = supabase
    .from('questions')
    .select('id')
    .eq('discipline', discipline)

  if (topic) {
    questionsQuery = questionsQuery.eq('topic', topic)
  }

  if (eligibleExamIds) {
    questionsQuery = questionsQuery.in('exam_id', eligibleExamIds)
  }

  const { data: questions, error: questionsError } = await questionsQuery

  if (questionsError) {
    throw new Error(questionsError.message)
  }

  const selectedQuestionIds = shuffle((questions ?? []).map((question) => question.id)).slice(
    0,
    questionCount
  )

  if (selectedQuestionIds.length === 0) {
    throw new Error('Nenhuma questão encontrada com os filtros selecionados.')
  }

  return createAttemptWithQuestions({
    supabase,
    userId,
    mode: 'custom',
    discipline,
    questionIds: selectedQuestionIds,
    filters: {
      discipline,
      topic,
      banca,
      year,
      questionCount: selectedQuestionIds.length,
    },
  })
}

export async function loadAttemptQuestions({
  supabase,
  attemptId,
}: {
  supabase: SupabaseClient
  attemptId: string
}) {
  const { data, error } = await supabase
    .from('attempt_questions')
    .select(`position, question:questions(${ATTEMPT_QUESTION_SELECT})`)
    .eq('attempt_id', attemptId)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? [])
    .map((row) => normalizeQuestion(row.question))
    .filter((question): question is AttemptQuestion => question !== null)
}

export async function getAttemptSummary({
  supabase,
  attemptId,
}: {
  supabase: SupabaseClient
  attemptId: string
}): Promise<AttemptSummary> {
  const { count: totalQuestions, error: totalError } = await supabase
    .from('attempt_questions')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)

  if (totalError) {
    throw new Error(totalError.message)
  }

  const { count: answeredCount, error: answeredError } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)

  if (answeredError) {
    throw new Error(answeredError.message)
  }

  const { count: correctCount, error: correctError } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)
    .eq('correta', true)

  if (correctError) {
    throw new Error(correctError.message)
  }

  const total = totalQuestions ?? 0
  const answered = answeredCount ?? 0
  const correct = correctCount ?? 0
  const unanswered = Math.max(0, total - answered)
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  return {
    total,
    answered,
    correct,
    unanswered,
    percent,
    passed: total > 0 ? percent >= ATTEMPT_PASS_PERCENTAGE : null,
  }
}
