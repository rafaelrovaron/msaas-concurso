'use server'

import { createClient } from '@/lib/supabase/server'
import { getAttemptSummary } from '@/lib/attempts'

export async function finishAttempt(attemptId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sessão expirada. Faça login novamente.' }
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, finished_at')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptError || !attempt || attempt.user_id !== user.id) {
    return { error: 'Tentativa não encontrada.' }
  }

  if (attempt.finished_at) {
    return { ok: true }
  }

  const summary = await getAttemptSummary({ supabase, attemptId })

  const { error: finishError } = await supabase
    .from('attempts')
    .update({
      score: summary.correct,
      passed: summary.passed,
      finished_at: new Date().toISOString(),
    })
    .eq('id', attemptId)

  if (finishError) {
    return { error: finishError.message }
  }

  return { ok: true }
}
