import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const hasE2EDatabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

type CustomExamShortageFilter = {
  availableQuestionCount: number
  discipline: string
  topic: string
}

function requireE2EDatabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export async function findCustomExamShortageFilter(
  requestedQuestionCount: number
): Promise<CustomExamShortageFilter | null> {
  const supabase = requireE2EDatabaseClient()
  const { data, error } = await supabase.from('questions').select('discipline, topic')

  if (error) {
    throw new Error(`Could not discover custom-exam question metadata: ${error.message}`)
  }

  const groupedCounts = new Map<string, CustomExamShortageFilter>()

  for (const question of data ?? []) {
    if (!question.discipline || !question.topic) continue

    const key = `${question.discipline}\u0000${question.topic}`
    const current = groupedCounts.get(key)

    groupedCounts.set(key, {
      availableQuestionCount: (current?.availableQuestionCount ?? 0) + 1,
      discipline: question.discipline,
      topic: question.topic,
    })
  }

  const shortageFilters = Array.from(groupedCounts.values()).filter(
    (filter) =>
      filter.availableQuestionCount > 0 && filter.availableQuestionCount < requestedQuestionCount
  )

  shortageFilters.sort((left, right) => {
    if (left.availableQuestionCount !== right.availableQuestionCount) {
      return left.availableQuestionCount - right.availableQuestionCount
    }

    const disciplineComparison = left.discipline.localeCompare(right.discipline, 'pt-BR')

    if (disciplineComparison !== 0) return disciplineComparison

    return left.topic.localeCompare(right.topic, 'pt-BR')
  })

  return shortageFilters[0] ?? null
}
