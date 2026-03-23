import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatAttemptLabel(mode: 'full_exam' | 'custom') {
  return mode === 'full_exam' ? 'Prova completa' : 'Prova personalizada'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.name as string | undefined

  const [{ data: attempts }, { data: inProgressAttempt }, { data: finishedAttempts }] =
    await Promise.all([
      supabase.from('attempts').select('id, finished_at').eq('user_id', user?.id ?? ''),
      supabase
        .from('attempts')
        .select('id, mode, discipline, started_at')
        .eq('user_id', user?.id ?? '')
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('attempts')
        .select('id, mode, discipline, score, passed, finished_at')
        .eq('user_id', user?.id ?? '')
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(3),
    ])

  const totalAttempts = attempts?.length ?? 0
  const totalFinished = attempts?.filter((attempt) => attempt.finished_at).length ?? 0
  const inProgressCount = Math.max(0, totalAttempts - totalFinished)
  const approvedCount =
    finishedAttempts?.filter((attempt) => attempt.passed === true).length ?? 0

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl shadow-slate-200/40 backdrop-blur">
        <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-9">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
              Painel de estudo
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {userName
                ? `${userName}, vamos ganhar ritmo hoje.`
                : 'Organize sua proxima sessao de estudo.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Retome uma tentativa em andamento, inicie uma prova completa ou monte um treino
              personalizado com foco nas disciplinas em que voce precisa evoluir.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={inProgressAttempt ? `/dashboard/attempts/${inProgressAttempt.id}` : '/dashboard/exams'}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                {inProgressAttempt ? 'Continuar tentativa' : 'Comecar prova completa'}
              </Link>
              <Link
                href="/dashboard/study"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Montar prova customizada
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="text-sm text-slate-500">Tentativas criadas</div>
              <div className="mt-1 text-3xl font-semibold text-slate-950">{totalAttempts}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="text-sm text-slate-500">Em andamento</div>
              <div className="mt-1 text-3xl font-semibold text-slate-950">{inProgressCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="text-sm text-slate-500">Aprovacoes recentes</div>
              <div className="mt-1 text-3xl font-semibold text-slate-950">{approvedCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Proximos passos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Um painel simples para manter constancia e diminuir friccao.
              </p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Estudo ativo
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href={inProgressAttempt ? `/dashboard/attempts/${inProgressAttempt.id}` : '/dashboard/exams'}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/70"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {inProgressAttempt ? 'Retomar ultima tentativa' : 'Comecar uma prova completa'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {inProgressAttempt
                    ? `${formatAttemptLabel(inProgressAttempt.mode)}${inProgressAttempt.discipline ? ` - ${inProgressAttempt.discipline}` : ''}`
                    : 'Escolha uma prova real e treine no formato original.'}
                </div>
              </div>
              <span className="text-sm font-semibold text-sky-700">Abrir</span>
            </Link>

            <Link
              href="/dashboard/study"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/70"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">Montar treino rapido</div>
                <div className="mt-1 text-sm text-slate-500">
                  Foque em disciplina, assunto, banca e quantidade de questoes.
                </div>
              </div>
              <span className="text-sm font-semibold text-sky-700">Criar</span>
            </Link>

            <Link
              href="/dashboard/progress"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/70"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">Revisar desempenho</div>
                <div className="mt-1 text-sm text-slate-500">
                  Veja onde voce erra mais e o que precisa revisar primeiro.
                </div>
              </div>
              <span className="text-sm font-semibold text-sky-700">Ver</span>
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/30">
          <h2 className="text-xl font-semibold text-slate-950">Ultimas tentativas finalizadas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use os resultados recentes para decidir sua proxima sessao.
          </p>

          <div className="mt-6 space-y-3">
            {finishedAttempts && finishedAttempts.length > 0 ? (
              finishedAttempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/dashboard/attempts/${attempt.id}/review`}
                  className="block rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-sky-200 hover:bg-sky-50/70"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatAttemptLabel(attempt.mode)}
                        {attempt.discipline ? ` - ${attempt.discipline}` : ''}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Finalizada em{' '}
                        {attempt.finished_at
                          ? new Date(attempt.finished_at).toLocaleDateString('pt-BR')
                          : 'data indisponivel'}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        attempt.passed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {attempt.passed ? 'Aprovado' : 'Revisar'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    Score atual: <span className="font-semibold text-slate-950">{attempt.score ?? 0}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600">
                Ainda nao ha tentativas finalizadas. Sua primeira prova ja vai alimentar esse painel.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
