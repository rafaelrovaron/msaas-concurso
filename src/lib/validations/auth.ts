import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Informe um email valido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo.'),
    email: z.email('Informe um email valido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao coincidem.',
  })

export const resetPasswordSchema = z.object({
  email: z.email('Informe um email valido.'),
})

export const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao coincidem.',
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>
