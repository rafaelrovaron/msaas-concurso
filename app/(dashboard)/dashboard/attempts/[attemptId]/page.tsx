import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AttemptRunner from '@/components/attempts/AttemptRunner'

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

  // precisa estar logado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // carregar attempt (e garantir que é do usuário)
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('id, user_id, exam_id, materia, started_at, finished_at')
    .eq('id', attemptId)
    .maybeSingle()

    if (attemptError || !attempt) {
    return (
        <div className="p-8">
        <p className="text-sm text-red-600">
            Tentativa não encontrada.
        </p>

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
            className="mt-4 inline-block text-blue-600 hover:underline text-sm"
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
    // se já finalizou, manda pra revisão (vamos criar depois)
    redirect(`/dashboard/attempts/${attemptId}/review`)
  }

  // carregar prova (só pra mostrar cabeçalho)
  const { data: exam } = await supabase
    .from('exams')
    .select('id, concurso, banca, ano, nota_corte')
    .eq('id', attempt.exam_id)
    .maybeSingle()

  // carregar questões do attempt (filtra por matéria se existir)
  let questionsQuery = supabase
    .from('questions')
    .select('id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, correta, materia')
    .eq('exam_id', attempt.exam_id)
    .order('id', { ascending: true })

  if (attempt.materia) {
    questionsQuery = questionsQuery.eq('materia', attempt.materia)
  }

  const { data: questions, error: questionsError } = await questionsQuery

  if (questionsError || !questions || questions.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Nenhuma questão encontrada para esta tentativa.
        </p>
        <Link href="/dashboard/exams" className="text-blue-600 hover:underline text-sm">
          Voltar para provas
        </Link>
      </div>
    )
  }

  // carregar respostas já dadas (pra preencher se voltar)
  const { data: answers } = await supabase
    .from('answers')
    .select('question_id, resposta')
    .eq('attempt_id', attemptId)

  // índice atual (1-based via query param)
  const currentIndex = Math.max(1, Number(q ?? '1') || 1)

  return (
    <div className="p-8">
      <AttemptRunner
        attemptId={attemptId}
        examTitle={exam ? `${exam.concurso} • ${exam.banca} • ${exam.ano}` : 'Prova'}
        notaCorte={exam?.nota_corte ?? null}
        materia={attempt.materia}
        questions={questions}
        initialAnswers={answers ?? []}
        initialIndex={currentIndex}
      />
    </div>
  )
}
