'use server'

import { createClient } from '@/lib/supabase/server'

type SaveAnswerInput = {
  attemptId: string
  questionId: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
  correta: boolean
}

export async function saveAttemptAnswer({
  attemptId,
  questionId,
  resposta,
  correta,
}: SaveAnswerInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sessao expirada. Faca login novamente.' }
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, finished_at')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptError || !attempt || attempt.user_id !== user.id) {
    return { error: 'Tentativa nao encontrada.' }
  }

  if (attempt.finished_at) {
    return {
      error: 'Esta tentativa ja foi finalizada.',
      finished: true,
    }
  }

  const { data: attemptQuestion, error: attemptQuestionError } = await supabase
    .from('attempt_questions')
    .select('id')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (attemptQuestionError || !attemptQuestion) {
    return { error: 'Questao nao pertence a esta tentativa.' }
  }

  const { error: saveError } = await supabase
    .from('answers')
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        resposta,
        correta,
      },
      { onConflict: 'attempt_id,question_id' }
    )

  if (saveError) {
    const isFinishedWriteBlock =
      saveError.message.toLowerCase().includes('finalizada') ||
      saveError.message.toLowerCase().includes('finished')

    return {
      error: isFinishedWriteBlock
        ? 'Esta tentativa ja foi finalizada.'
        : saveError.message,
      finished: isFinishedWriteBlock,
    }
  }

  return { ok: true }
}

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

  const { data: finished, error: finishError } = await supabase.rpc('finish_attempt', {
    p_attempt_id: attemptId,
  })

  if (finishError) {
    return { error: finishError.message }
  }

  if (!finished) {
    return { error: 'Nao foi possivel finalizar a tentativa.' }
  }

  return { ok: true }
}
