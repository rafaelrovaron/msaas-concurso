import { redirect } from 'next/navigation'
import Link from 'next/link'
import AttemptRunner from '@/components/attempts/AttemptRunner'
import { loadAttemptQuestions } from '@/lib/attempts'
import { createClient } from '@/lib/supabase/server'

type AttemptFilters = {
  discipline?: string | null
  topic?: string | null
  banca?: string | null
  year?: number | null
  questionCount?: number | null
}

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

export default async function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { attemptId } = await params
  const { q } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, exam_id, discipline, mode, filters, started_at, finished_at')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptError || !attempt) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Tentativa não encontrada.</p>
        <p className="mt-2 text-xs text-gray-600">
          attemptId: <code>{attemptId}</code>
        </p>
        {attemptError && (
          <p className="mt-2 text-xs text-red-600">
            erro: <code>{attemptError.message}</code>
          </p>
        )}
        <Link
          href="/dashboard/exams"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Voltar para provas
        </Link>
      </div>
    )
  }

  if (attempt.user_id !== user.id) {
    redirect('/dashboard/exams')
  }

  if (attempt.finished_at) {
    redirect(`/dashboard/attempts/${attemptId}/review`)
  }

  const exam = attempt.exam_id
    ? (
        await supabase
          .from('exams')
          .select('concurso, banca, ano, nota_corte')
          .eq('id', attempt.exam_id)
          .maybeSingle()
      ).data ?? null
    : null

  const questions = await loadAttemptQuestions({ supabase, attemptId })

  if (questions.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Nenhuma questão encontrada para esta tentativa.</p>
        <Link href="/dashboard/exams" className="text-sm text-blue-600 hover:underline">
          Voltar para provas
        </Link>
      </div>
    )
  }

  const { data: answers } = await supabase
    .from('answers')
    .select('question_id, resposta')
    .eq('attempt_id', attemptId)

  const currentIndex = Math.max(1, Number(q ?? '1') || 1)

  return (
    <div className="p-8">
      <AttemptRunner
        attemptId={attemptId}
        attemptMode={attempt.mode}
        examTitle={buildAttemptTitle({ mode: attempt.mode, exam })}
        notaCorte={attempt.mode === 'full_exam' ? exam?.nota_corte ?? null : null}
        discipline={attempt.discipline}
        filters={(attempt.filters ?? {}) as AttemptFilters}
        questions={questions}
        initialAnswers={answers ?? []}
        initialIndex={currentIndex}
      />
    </div>
  )
}
