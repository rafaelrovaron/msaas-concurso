import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params

  const supabase = await createClient()

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, concurso, banca, ano, nota_corte')
    .eq('id', examId)
    .maybeSingle()

  if (examError || !exam) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Prova não encontrada.
        </p>
        <p className="mt-2 text-xs text-gray-600">
          examId: <code>{examId}</code>
        </p>
        <Link
          href="/dashboard/exams"
          className="mt-4 inline-block text-blue-600 hover:underline text-sm"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('materia')
    .eq('exam_id', examId)

  if (qError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          Erro ao carregar questões: {qError.message}
        </p>
      </div>
    )
  }

  const materias = Array.from(new Set((questions ?? []).map((q) => q.materia))).sort()

  async function startAttempt(formData: FormData) {
  'use server'

  const { examId } = await params

  const materiaRaw = (formData.get('materia') as string) || ''
  const materia = materiaRaw.trim() === '' ? null : materiaRaw.trim()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({
      user_id: user.id,
      exam_id: examId,
      materia,
    })
    .select()
    .single()

    if (error) {
      throw new Error(`Erro ao criar attempt: ${error.message}`)
    }

    if (!attempt) {
      throw new Error('Attempt não retornado após insert')
    }

    redirect(`/dashboard/attempts/${attempt.id}`)
  }


  return (
    <div className="p-8">
      <Link
        href="/dashboard/exams"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Voltar
      </Link>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500">
          {exam.banca} • {exam.ano}
        </div>

        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          {exam.concurso}
        </h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            Nota corte: <span className="font-medium">{exam.nota_corte}</span>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            Matérias: <span className="font-medium">{materias.length}</span>
          </div>
        </div>

        <form action={startAttempt} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Estudar por matéria (opcional)
            </label>

            <select
              name="materia"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="">Prova completa</option>
              {materias.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-gray-500">
              Se escolher uma matéria, a tentativa usará apenas questões dessa matéria.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Iniciar
          </button>
        </form>
      </div>
    </div>
  )
}
