import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; banca?: string; ano?: string }>
}) {
  const { q = '', banca = '', ano = '' } = await searchParams
  const supabase = await createClient()

  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, concurso, banca, ano, nota_corte, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-slate-950">Provas</h1>
        <p className="mt-4 text-sm text-red-700">Erro ao carregar provas: {error.message}</p>
      </div>
    )
  }

  const normalizedQuery = q.trim().toLowerCase()
  const availableBancas = Array.from(new Set((exams ?? []).map((exam) => exam.banca).filter(Boolean))).sort()
  const availableYears = Array.from(new Set((exams ?? []).map((exam) => exam.ano))).sort((first, second) => second - first)
  const filteredExams = (exams ?? []).filter((exam) => {
    const matchesQuery =
      !normalizedQuery ||
      exam.concurso.toLowerCase().includes(normalizedQuery) ||
      exam.banca.toLowerCase().includes(normalizedQuery)
    const matchesBanca = !banca || exam.banca === banca
    const matchesYear = !ano || String(exam.ano) === ano

    return matchesQuery && matchesBanca && matchesYear
  })

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-7 shadow-xl shadow-slate-200/35 backdrop-blur sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Banco de provas
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Escolha uma prova real e treine no ritmo do concurso.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Filtre por banca, ano ou termo de busca. A ideia aqui e facilitar decisao rapida sem
              esconder o contexto da prova.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[24rem]">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-sm text-slate-500">Provas disponiveis</div>
              <div className="mt-1 text-2xl font-semibold text-slate-950">{exams?.length ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-sm text-slate-500">Bancas</div>
              <div className="mt-1 text-2xl font-semibold text-slate-950">{availableBancas.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-sm text-slate-500">Resultados</div>
              <div className="mt-1 text-2xl font-semibold text-slate-950">{filteredExams.length}</div>
            </div>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 lg:grid-cols-[1.4fr_0.8fr_0.6fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Buscar
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Concurso, banca ou palavra-chave"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Banca
            </span>
            <select
              name="banca"
              defaultValue={banca}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Todas</option>
              {availableBancas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ano
            </span>
            <select
              name="ano"
              defaultValue={ano}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Todos</option>
              {availableYears.map((item) => (
                <option key={item} value={String(item)}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Filtrar
            </button>
            <Link
              href="/dashboard/exams"
              className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar
            </Link>
          </div>
        </form>
      </section>

      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Resultados</h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecione uma prova para ver contexto, quantidade de questoes e iniciar a tentativa.
          </p>
        </div>

        <Link
          href="/dashboard/study"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Prova customizada
        </Link>
      </section>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {filteredExams.map((exam) => (
          <article
            key={exam.id}
            className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-200/30 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {exam.banca}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {exam.ano}
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Prova real
              </span>
            </div>

            <h3 className="mt-5 text-xl font-semibold leading-8 text-slate-950">{exam.concurso}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Simulado fiel ao exame original, ideal para medir ritmo, resistencia e desempenho.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Nota de corte</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{exam.nota_corte}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Fluxo</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">Completo</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-500">Abrir detalhes antes de iniciar</div>
              <Link
                href={`/dashboard/exams/${exam.id}`}
                className="text-sm font-semibold text-sky-700 transition group-hover:text-sky-800"
              >
                Ver prova
              </Link>
            </div>
          </article>
        ))}
      </div>

      {exams?.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/80 p-10 text-center">
          <p className="text-sm text-slate-600">Nenhuma prova cadastrada ainda.</p>
        </div>
      )}

      {exams?.length !== 0 && filteredExams.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/80 p-10 text-center">
          <p className="text-sm text-slate-600">
            Nenhuma prova encontrada com os filtros atuais. Ajuste a busca para ampliar os resultados.
          </p>
        </div>
      )}
    </div>
  )
}
