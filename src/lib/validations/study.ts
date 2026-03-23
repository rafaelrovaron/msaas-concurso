import { z } from 'zod'

export const customExamSchema = z.object({
  discipline: z.string().min(1, 'Selecione uma disciplina.'),
  topic: z.string().optional(),
  banca: z.string().optional(),
  year: z.string().optional(),
  questionCount: z.enum(['10', '20', '30', '40'], {
    error: 'Selecione uma quantidade valida de questoes.',
  }),
})

export type CustomExamFormValues = z.infer<typeof customExamSchema>
