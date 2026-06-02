'use server'

import { startCustomAttempt, type StartCustomAttemptResult } from '@/lib/attempts'
import { customAttemptInputSchema } from '@/lib/validations/study'
import { createClient } from '@/lib/supabase/server'

type SaveAnswerInput = {
  attemptId: string
  questionId: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
}

export async function saveAttemptAnswer({
  attemptId,
  questionId,
  resposta,
}: SaveAnswerInput) {
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
    return {
      error: 'Esta tentativa já foi finalizada.',
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
    return { error: 'Questão não pertence a esta tentativa.' }
  }

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('correta')
    .eq('id', questionId)
    .maybeSingle()

  if (questionError || !question) {
    return { error: 'Questão não encontrada.' }
  }

  const correta = resposta === question.correta

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
    const normalizedMessage = saveError.message.toLowerCase()
    const isFinishedWriteBlock =
      normalizedMessage.includes('finalizada') || normalizedMessage.includes('finished')

    return {
      error: isFinishedWriteBlock ? 'Esta tentativa já foi finalizada.' : saveError.message,
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
    return { error: 'Não foi possível finalizar a tentativa.' }
  }

  return { ok: true }
}

export async function startCustomAttemptAction(input: unknown): Promise<StartCustomAttemptResult> {
  const parsedInput = customAttemptInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      message:
        parsedInput.error.issues[0]?.message ?? 'Dados inválidos para gerar a prova personalizada.',
      status: 'error',
    }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      message: 'Sessão expirada. Faça login novamente.',
      status: 'error',
    }
  }

  try {
    return await startCustomAttempt({
      ...parsedInput.data,
      supabase,
      userId: user.id,
    })
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a prova personalizada.',
      status: 'error',
    }
  }
}
