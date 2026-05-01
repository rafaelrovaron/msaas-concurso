export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          attempt_id: string
          correta: boolean | null
          id: string
          question_id: string
          resposta: string
        }
        Insert: {
          attempt_id: string
          correta?: boolean | null
          id?: string
          question_id: string
          resposta: string
        }
        Update: {
          attempt_id?: string
          correta?: boolean | null
          id?: string
          question_id?: string
          resposta?: string
        }
        Relationships: []
      }
      attempt_questions: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          position: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          position: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          position?: number
          question_id?: string
        }
        Relationships: []
      }
      attempts: {
        Row: {
          discipline: string | null
          exam_id: string | null
          filters: Json
          finished_at: string | null
          id: string
          mode: 'full_exam' | 'custom'
          passed: boolean | null
          score: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          discipline?: string | null
          exam_id?: string | null
          filters?: Json
          finished_at?: string | null
          id?: string
          mode?: 'full_exam' | 'custom'
          passed?: boolean | null
          score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          discipline?: string | null
          exam_id?: string | null
          filters?: Json
          finished_at?: string | null
          id?: string
          mode?: 'full_exam' | 'custom'
          passed?: boolean | null
          score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          ano: number
          banca: string
          concurso: string
          created_at: string
          id: string
          nota_corte: number
        }
        Insert: {
          ano: number
          banca: string
          concurso: string
          created_at?: string
          id?: string
          nota_corte: number
        }
        Update: {
          ano?: number
          banca?: string
          concurso?: string
          created_at?: string
          id?: string
          nota_corte?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          alternativa_e: string
          correta: string
          discipline: string | null
          enunciado: string
          exam_id: string
          id: string
          topic: string | null
        }
        Insert: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          alternativa_e: string
          correta: string
          discipline?: string | null
          enunciado: string
          exam_id: string
          id?: string
          topic?: string | null
        }
        Update: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          alternativa_e?: string
          correta?: string
          discipline?: string | null
          enunciado?: string
          exam_id?: string
          id?: string
          topic?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_attempt_with_questions: {
        Args: {
          p_discipline?: string | null
          p_exam_id?: string | null
          p_filters?: Json
          p_mode: string
          p_question_ids: string[]
          p_user_id: string
        }
        Returns: string
      }
      finish_attempt: {
        Args: {
          p_attempt_id: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
