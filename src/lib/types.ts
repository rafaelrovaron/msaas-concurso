import type { Database } from '@/lib/supabase/database.types'

export type AnswerRow = Database['public']['Tables']['answers']['Row']
export type AttemptQuestionRow = Database['public']['Tables']['attempt_questions']['Row']
export type AttemptRow = Database['public']['Tables']['attempts']['Row']
export type ExamRow = Database['public']['Tables']['exams']['Row']
export type QuestionRow = Database['public']['Tables']['questions']['Row']
