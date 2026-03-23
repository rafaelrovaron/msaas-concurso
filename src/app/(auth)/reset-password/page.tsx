'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '@/components/ui/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [message, setMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setMessage(null)

    const redirectTo = `${window.location.origin}/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Email de redefinicao enviado!')
  }

  return (
    <AuthLayout title="Redefinir senha" subtitle="Enviaremos um link para seu email">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {message && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <Button type="submit" fullWidth loading={isSubmitting} loadingText="Enviando...">
          Enviar link
        </Button>
      </form>
    </AuthLayout>
  )
}
