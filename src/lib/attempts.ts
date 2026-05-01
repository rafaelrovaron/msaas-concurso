import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export const ATTEMPT_PASS_PERCENTAGE = 70

export type AttemptMode = 'full_exam' | 'custom'
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E'

export type AttemptFilters = {
  availableQuestionCount?: number | null
  banca?: string | null
  discipline?: string | null
  examId?: string | null
  questionCount?: number | null
  requestedQuestionCount?: number | null
  topic?: string | null
  year?: number | null
}

export type AttemptQuestion = {
  id: string
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  correta: AnswerOption
  discipline: string | null
  topic: string | null
}

type CreateAttemptParams = {
  supabase: SupabaseClient<Database>
  userId: string
  mode: AttemptMode
  questionIds: string[]
  examId?: string | null
  discipline?: string | null
  filters?: AttemptFilters
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

export type CustomAttemptInput = {
  banca: string | null
  confirmed?: boolean
  discipline: string
  questionCount: number
  topic: string | null
  year: number | null
}

export type StartCustomAttemptResult =
  | {
      attemptId: string
      status: 'created'
    }
  | {
      availableQuestionCount: number
      requestedQuestionCount: number
      status: 'needs_confirmation'
    }
  | {
      message: string
      status: 'error'
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

  const { data: attemptId, error: attemptError } = await supabase.rpc(
    'create_attempt_with_questions',
    {
      p_user_id: userId,
      p_mode: mode,
      p_question_ids: questionIds,
      p_exam_id: examId,
      p_discipline: discipline,
      p_filters: filters,
    }
  )

  if (attemptError || !attemptId) {
    throw new Error(attemptError?.message ?? 'Não foi possível criar a tentativa.')
  }

  return { id: attemptId }
}

export async function createFullExamAttempt({
  supabase,
  userId,
  examId,
}: {
  supabase: SupabaseClient<Database>
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

async function getEligibleCustomQuestionIds({
  supabase,
  discipline,
  topic,
  banca,
  year,
}: Omit<CustomAttemptInput, 'confirmed' | 'questionCount'> & {
  supabase: SupabaseClient<Database>
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
      return []
    }
  }

  let questionsQuery = supabase.from('questions').select('id').eq('discipline', discipline)

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

  return shuffle((questions ?? []).map((question) => question.id))
}

export async function startCustomAttempt({
  supabase,
  userId,
  discipline,
  topic,
  banca,
  year,
  questionCount,
  confirmed = false,
}: CustomAttemptInput & {
  supabase: SupabaseClient<Database>
  userId: string
}): Promise<StartCustomAttemptResult> {
  const questionIds = await getEligibleCustomQuestionIds({
    supabase,
    discipline,
    topic,
    banca,
    year,
  })

  const availableQuestionCount = questionIds.length

  if (availableQuestionCount === 0) {
    return {
      message: 'Nenhuma questão encontrada com os filtros selecionados.',
      status: 'error',
    }
  }

  if (availableQuestionCount < questionCount && !confirmed) {
    return {
      availableQuestionCount,
      requestedQuestionCount: questionCount,
      status: 'needs_confirmation',
    }
  }

  const finalQuestionCount = Math.min(questionCount, availableQuestionCount)
  const attempt = await createAttemptWithQuestions({
    supabase,
    userId,
    mode: 'custom',
    discipline,
    questionIds: questionIds.slice(0, finalQuestionCount),
    filters: {
      availableQuestionCount,
      banca,
      discipline,
      questionCount: finalQuestionCount,
      requestedQuestionCount: questionCount,
      topic,
      year,
    },
  })

  return {
    attemptId: attempt.id,
    status: 'created',
  }
}

export async function loadAttemptQuestions({
  supabase,
  attemptId,
}: {
  supabase: SupabaseClient<Database>
  attemptId: string
}) {
  const { data: attemptQuestions, error: attemptQuestionsError } = await supabase
    .from('attempt_questions')
    .select('position, question_id')
    .eq('attempt_id', attemptId)
    .order('position', { ascending: true })

  if (attemptQuestionsError) {
    throw new Error(attemptQuestionsError.message)
  }

  const questionIds = (attemptQuestions ?? []).map((row) => row.question_id)

  if (questionIds.length === 0) {
    return []
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(ATTEMPT_QUESTION_SELECT)
    .in('id', questionIds)

  if (questionsError) {
    throw new Error(questionsError.message)
  }

  const questionMap = new Map((questions ?? []).map((question) => [question.id, question as AttemptQuestion]))

  return (attemptQuestions ?? [])
    .map((row) => questionMap.get(row.question_id) ?? null)
    .filter((question): question is AttemptQuestion => question !== null)
}

export async function getAttemptSummary({
  supabase,
  attemptId,
}: {
  supabase: SupabaseClient<Database>
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
