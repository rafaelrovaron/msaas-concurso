import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ExamsPage() {
  const supabase = await createClient()

  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, concurso, banca, ano, nota_corte, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Provas</h1>
        <p className="mt-4 text-sm text-red-600">
          Erro ao carregar provas: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Provas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Escolha uma prova para começar a praticar.
          </p>
        </div>

        <Link
          href="/dashboard/study"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Estudar por Matéria
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exams?.map((exam) => (
          <div
            key={exam.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="text-sm text-gray-500">
              {exam.banca} • {exam.ano}
            </div>

            <div className="mt-1 text-base font-semibold text-gray-900">
              {exam.concurso}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Nota corte: <span className="font-medium">{exam.nota_corte}</span>
              </div>

              <Link
                href={`/dashboard/exams/${exam.id}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        ))}
      </div>

      {exams?.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-600">
            Nenhuma prova cadastrada ainda.
          </p>
        </div>
      )}
    </div>
  )
}
