import { z } from 'zod'

export const CUSTOM_ATTEMPT_QUESTION_COUNTS = [10, 20, 30, 40] as const

const invalidQuestionCountMessage = 'Selecione uma quantidade válida de questões.'

const customAttemptQuestionCountSchema = z.union(
  [z.literal(10), z.literal(20), z.literal(30), z.literal(40)],
  { error: invalidQuestionCountMessage }
)

const questionCountSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return value
}, customAttemptQuestionCountSchema)

const nullableTrimmedStringSchema = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()
  return trimmedValue === '' ? null : trimmedValue
}, z.string({ error: 'Filtro inválido.' }).nullable())

const nullableYearSchema = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue === '' ? null : Number(trimmedValue)
  }

  return value
}, z.number({ error: 'Selecione um ano válido.' }).int('Selecione um ano válido.').nullable())

export const customExamSchema = z.object({
  discipline: z.string().min(1, 'Selecione uma disciplina.'),
  topic: z.string().optional(),
  banca: z.string().optional(),
  year: z.string().optional(),
  questionCount: z.enum(['10', '20', '30', '40'], {
    error: invalidQuestionCountMessage,
  }),
})

export const customAttemptInputSchema = z.object({
  banca: nullableTrimmedStringSchema,
  confirmed: z.boolean({ error: 'Confirmação inválida.' }).optional(),
  discipline: z
    .preprocess(
      (value) => (typeof value === 'string' ? value.trim() : value),
      z.string({ error: 'Selecione uma disciplina.' })
    )
    .pipe(z.string().min(1, 'Selecione uma disciplina.')),
  questionCount: questionCountSchema,
  topic: nullableTrimmedStringSchema,
  year: nullableYearSchema,
})

export type CustomExamFormValues = z.infer<typeof customExamSchema>
export type NormalizedCustomAttemptInput = z.infer<typeof customAttemptInputSchema>
