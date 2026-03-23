import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttemptReview from '@/components/attempts/AttemptReview'
import { loadAttemptQuestions } from '@/lib/attempts'
import { createClient } from '@/lib/supabase/server'

function buildAttemptTitle({
  mode,
  exam,
}: {
  mode: 'full_exam' | 'custom'
  exam: { concurso: string; banca: string; ano: number } | null
}) {
  if (mode === 'custom' || !exam) {
    return 'Prova personalizada'
  }

  return `${exam.concurso} • ${exam.banca} • ${exam.ano}`
}

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, exam_id, discipline, mode, finished_at')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptError || !attempt) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Tentativa não encontrada.</p>
        <Link href="/dashboard/exams" className="text-sm text-blue-600 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (attempt.user_id !== user.id) redirect('/dashboard/exams')
  if (!attempt.finished_at) redirect(`/dashboard/attempts/${attemptId}`)

  const exam = attempt.exam_id
    ? (
        await supabase
          .from('exams')
          .select('concurso, banca, ano')
          .eq('id', attempt.exam_id)
          .maybeSingle()
      ).data ?? null
    : null

  const questions = await loadAttemptQuestions({ supabase, attemptId })

  if (questions.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Sem questões para revisar.</p>
      </div>
    )
  }

  const { data: answers } = await supabase
    .from('answers')
    .select('question_id, resposta, correta')
    .eq('attempt_id', attemptId)

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard/attempts/${attemptId}/finish`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Voltar ao resumo
        </Link>

        <div className="mt-3 text-sm text-gray-500">
          {buildAttemptTitle({ mode: attempt.mode, exam })}
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Revisão</h1>

        <AttemptReview
          discipline={attempt.discipline}
          questions={questions}
          answers={answers ?? []}
        />
      </div>
    </div>
  )
}
