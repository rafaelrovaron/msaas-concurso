'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AuthLayout from '@/components/ui/AuthLayout'
import FormInput from '@/components/ui/FormInput'
import PrimaryButton from '@/components/ui/PrimaryButton'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Email de redefinição enviado!')
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Enviaremos um link para seu email"
    >
      <form onSubmit={handleReset} className="space-y-4">

        {message && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            {message}
          </div>
        )}

        <FormInput
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PrimaryButton type="submit" loading={loading}>
          Enviar link
        </PrimaryButton>

      </form>
    </AuthLayout>
  )
}
