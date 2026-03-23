import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Concurso Boost
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-gray-900">
          Prática inteligente para concursos públicos
        </h1>
        <p className="mt-4 text-base text-gray-600">
          Resolva provas completas, monte provas personalizadas e revise erros com uma
          navegação rápida e focada em aprendizado.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/exams"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Ver provas
          </Link>
          <Link
            href="/dashboard/study"
            className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Montar prova customizada
          </Link>
        </div>
      </div>
    </main>
  )
}
