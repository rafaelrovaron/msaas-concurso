import type { Database, Json } from '@/lib/supabase/database.types'

export type AnswerRow = Database['public']['Tables']['answers']['Row']
export type AttemptQuestionRow = Database['public']['Tables']['attempt_questions']['Row']
export type AttemptRow = Database['public']['Tables']['attempts']['Row']
export type ExamRow = Database['public']['Tables']['exams']['Row']
export type QuestionRow = Database['public']['Tables']['questions']['Row']

export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E'
export type AttemptMode = AttemptRow['mode']

export type AttemptFilters = {
  availableQuestionCount?: number | null
  banca?: string | null
  discipline?: string | null
  examId?: string | null
  questionCount?: number | null
  requestedQuestionCount?: number | null
  topic?: string | null
  year?: number | null
} & Record<string, Json | undefined>

export type AttemptQuestion = Pick<
  QuestionRow,
  | 'alternativa_a'
  | 'alternativa_b'
  | 'alternativa_c'
  | 'alternativa_d'
  | 'alternativa_e'
  | 'discipline'
  | 'enunciado'
  | 'exam_position'
  | 'id'
  | 'topic'
> & {
  correta: AnswerOption
}

export type AttemptSummary = {
  total: number
  answered: number
  correct: number
  unanswered: number
  percent: number
  passed: boolean | null
}
