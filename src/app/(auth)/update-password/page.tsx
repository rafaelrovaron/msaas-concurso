'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '@/components/ui/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { createClient } from '@/lib/supabase/client'
import { updatePasswordSchema, type UpdatePasswordFormValues } from '@/lib/validations/auth'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    setAuthError(null)

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    router.push('/login')
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Defina uma nova senha para sua conta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {authError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{authError}</div>}

        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" type="password" placeholder="********" {...register('password')} />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="********"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" fullWidth loading={isSubmitting} loadingText="Atualizando...">
          Atualizar senha
        </Button>
      </form>
    </AuthLayout>
  )
}
