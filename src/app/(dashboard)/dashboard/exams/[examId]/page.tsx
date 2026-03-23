import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createFullExamAttempt } from '@/lib/attempts'
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
      <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-700">Prova nao encontrada.</p>
        <p className="mt-2 text-xs text-slate-600">
          examId: <code>{examId}</code>
        </p>
        <Link
          href="/dashboard/exams"
          className="mt-4 inline-block text-sm font-medium text-sky-700 hover:underline"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('discipline')
    .eq('exam_id', examId)

  if (questionsError) {
    return (
      <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-700">Erro ao carregar questoes: {questionsError.message}</p>
      </div>
    )
  }

  const disciplineCount = new Set(
    (questions ?? []).map((question) => question.discipline).filter(Boolean)
  ).size
  const questionCount = questions?.length ?? 0

  async function startAttempt() {
    'use server'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const attempt = await createFullExamAttempt({
      supabase,
      userId: user.id,
      examId,
    })

    redirect(`/dashboard/attempts/${attempt.id}`)
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/exams" className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-900">
        {'<-'} Voltar para provas
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-xl shadow-slate-200/35">
        <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.3fr_0.85fr] lg:px-10 lg:py-9">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {exam.banca}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {exam.ano}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {exam.concurso}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Esta tentativa preserva a ordem da prova e remove filtros por disciplina para manter
              a experiencia o mais fiel possivel ao exame original.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                Modo: prova completa
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                Questoes nao respondidas contam como erro
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="text-sm text-slate-500">Nota de corte</div>
              <div className="mt-1 text-3xl font-semibold text-slate-950">{exam.nota_corte}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="text-sm text-slate-500">Questoes</div>
              <div className="mt-1 text-3xl font-semibold text-slate-950">{questionCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="text-sm text-slate-500">Disciplinas</div>
              <div className="mt-1 text-3xl font-semibold text-slate-950">{disciplineCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/30">
          <h2 className="text-xl font-semibold text-slate-950">O que esperar desta tentativa</h2>
          <div className="mt-5 space-y-3">
            {[
              'A ordem das questoes fica persistida para a tentativa.',
              'Voce pode revisar pendencias antes de finalizar.',
              'Questoes nao respondidas entram como incorretas no resultado final.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/30">
          <h2 className="text-xl font-semibold text-slate-950">Pronto para comecar?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Inicie quando tiver um bloco de tempo disponivel. O ideal e responder sem interrupcoes
            para medir desempenho com mais fidelidade.
          </p>

          <form action={startAttempt} className="mt-6 space-y-3">
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Iniciar prova completa
            </button>
            <Link
              href="/dashboard/study"
              className="inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Preferir prova customizada
            </Link>
          </form>
        </div>
      </section>
    </div>
  )
}
