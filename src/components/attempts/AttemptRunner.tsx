'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { finishAttempt } from '@/lib/actions/attempts'
import { createClient } from '@/lib/supabase/client'

type Question = {
  id: string
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  correta: 'A' | 'B' | 'C' | 'D' | 'E'
  discipline: string | null
  topic: string | null
}

type InitialAnswer = {
  question_id: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
}

type AttemptFilters = {
  discipline?: string | null
  topic?: string | null
  banca?: string | null
  year?: number | null
  questionCount?: number | null
}

type FinishStep = 'missing' | 'confirm' | null

export default function AttemptRunner({
  attemptId,
  attemptMode,
  examTitle,
  notaCorte,
  discipline,
  filters,
  questions,
  initialAnswers,
  initialIndex,
}: {
  attemptId: string
  attemptMode: 'full_exam' | 'custom'
  examTitle: string
  notaCorte: number | null
  discipline: string | null
  filters: AttemptFilters
  questions: Question[]
  initialAnswers: InitialAnswer[]
  initialIndex: number
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const total = questions.length

  const [answerMap, setAnswerMap] = useState(() => {
    const map = new Map<string, InitialAnswer['resposta']>()
    for (const answer of initialAnswers) {
      map.set(answer.question_id, answer.resposta)
    }
    return map
  })

  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 1), total))
  const current = questions[index - 1]

  const [selected, setSelected] = useState<InitialAnswer['resposta'] | ''>(() => {
    return answerMap.get(current.id) ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missingList, setMissingList] = useState<number[]>([])
  const [finishStep, setFinishStep] = useState<FinishStep>(null)
  const [isFinishing, setIsFinishing] = useState(false)

  const answeredCount = answerMap.size
  const missingCount = Math.max(0, total - answeredCount)
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0

  const getMissingQuestions = () => {
    const missing: number[] = []

    for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
      const question = questions[questionIndex]
      if (!answerMap.get(question.id)) {
        missing.push(questionIndex + 1)
      }
    }

    return missing
  }

  const goTo = (nextIndex: number) => {
    const safeIndex = Math.min(Math.max(nextIndex, 1), total)
    const nextQuestion = questions[safeIndex - 1]

    setIndex(safeIndex)
    setSelected(answerMap.get(nextQuestion.id) ?? '')
    setSavedMsg(null)
    setError(null)
    router.push(`/dashboard/attempts/${attemptId}?q=${safeIndex}`)
  }

  const questionStatus = (questionId: string, questionNumber: number) => {
    if (questionNumber === index) return 'current'
    if (answerMap.has(questionId)) return 'answered'
    return 'pending'
  }

  const persistAnswer = async (goNextAfterSave = false) => {
    setError(null)
    setSavedMsg(null)

    if (!selected) {
      setError('Selecione uma alternativa para salvar.')
      return
    }

    setSaving(true)

    const isCorrect = selected === current.correta
    const { error: saveError } = await supabase
      .from('answers')
      .upsert(
        {
          attempt_id: attemptId,
          question_id: current.id,
          resposta: selected,
          correta: isCorrect,
        },
        { onConflict: 'attempt_id,question_id' }
      )

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setAnswerMap((previous) => {
      const next = new Map(previous)
      next.set(current.id, selected)
      return next
    })

    setSavedMsg('Resposta salva.')
    setSaving(false)

    if (goNextAfterSave && index < total) {
      goTo(index + 1)
    }
  }

  const finalizeAttempt = async () => {
    setError(null)
    setIsFinishing(true)

    try {
      const result = await finishAttempt(attemptId)

      if (result.error) {
        setError(result.error)
        setIsFinishing(false)
        return
      }

      router.push(`/dashboard/attempts/${attemptId}/finish`)
    } catch {
      setError('Nao foi possivel finalizar a prova.')
      setIsFinishing(false)
    }
  }

  const handleFinish = () => {
    const missing = getMissingQuestions()

    if (missing.length === 0) {
      void finalizeAttempt()
      return
    }

    setMissingList(missing)
    setFinishStep('missing')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-xl shadow-slate-200/35">
        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-sm font-medium text-slate-500">{examTitle}</div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Questao {index} de {total}
              </h1>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {progressPct}% concluido
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {missingCount === 0 ? 'Sem pendencias' : `${missingCount} pendencias`}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {attemptMode === 'full_exam' ? 'Prova completa' : 'Personalizada'}
              </span>

              {discipline && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {discipline}
                </span>
              )}

              {filters.topic && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Assunto: {filters.topic}
                </span>
              )}

              {notaCorte !== null && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Nota de corte: {notaCorte}
                </span>
              )}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>
                  Respondidas <span className="font-semibold text-slate-950">{answeredCount}</span>/{total}
                </span>
                <span>{missingCount === 0 ? 'Tudo pronto para finalizar' : `${missingCount} faltando`}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Atual</div>
              <div className="mt-1 text-xl font-semibold text-slate-950">{index}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Respondidas</div>
              <div className="mt-1 text-xl font-semibold text-slate-950">{answeredCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Pendentes</div>
              <div className="mt-1 text-xl font-semibold text-slate-950">{missingCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/30">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {current.discipline ?? 'Sem disciplina'}
              {current.topic ? ` - ${current.topic}` : ''}
            </div>

            <button
              type="button"
              onClick={() => {
                setMissingList(getMissingQuestions())
                setFinishStep('missing')
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver pendentes
            </button>
          </div>

          <div className="rounded-2xl bg-slate-50/80 p-5">
            <p className="whitespace-pre-wrap text-base leading-8 text-slate-900">{current.enunciado}</p>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">
              Escolha uma alternativa e confirme a resposta.
            </legend>

            <div className="mt-4 space-y-3">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                const text =
                  letter === 'A'
                    ? current.alternativa_a
                    : letter === 'B'
                      ? current.alternativa_b
                      : letter === 'C'
                        ? current.alternativa_c
                        : letter === 'D'
                          ? current.alternativa_d
                          : current.alternativa_e

                const checked = selected === letter

                return (
                  <label
                    key={letter}
                    className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-4 text-sm transition ${
                      checked
                        ? 'border-sky-200 bg-sky-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      className="mt-1 h-4 w-4 accent-sky-600"
                      checked={checked}
                      onChange={() => setSelected(letter)}
                    />
                    <span className="font-semibold text-slate-700">{letter}.</span>
                    <span className="leading-7 text-slate-800">{text}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-4 space-y-2">
            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {savedMsg && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{savedMsg}</div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === total}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Proxima
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void persistAnswer(false)}
                disabled={saving}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar resposta'}
              </button>

              <button
                type="button"
                onClick={() => void persistAnswer(true)}
                disabled={saving || index === total}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Salvar e avancar
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={isFinishing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {isFinishing ? 'Finalizando...' : 'Finalizar'}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            O gabarito so aparece na revisao depois que a tentativa for finalizada.
          </p>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-200/30">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Mapa da prova
              </h2>
              <button
                type="button"
                onClick={() => {
                  setMissingList(getMissingQuestions())
                  setFinishStep('missing')
                }}
                className="text-xs font-semibold text-sky-700"
              >
                Pendentes
              </button>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((question, questionIndex) => {
                const questionNumber = questionIndex + 1
                const status = questionStatus(question.id, questionNumber)

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goTo(questionNumber)}
                    className={`rounded-xl px-0 py-2 text-sm font-semibold transition ${
                      status === 'current'
                        ? 'bg-slate-950 text-white'
                        : status === 'answered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {questionNumber}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-950" />
                Questao atual
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Respondida
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                Pendente
              </div>
            </div>
          </div>
        </aside>
      </div>

      {finishStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl shadow-slate-950/20">
            {finishStep === 'missing' ? (
              <>
                <h2 className="text-lg font-semibold text-slate-950">Questoes pendentes</h2>

                {missingList.length === 0 ? (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    Nenhuma pendente. Voce ja pode finalizar.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    Existem {missingList.length} questoes pendentes. Voce pode navegar ate elas ou
                    finalizar a prova mesmo assim.
                  </p>
                )}

                {missingList.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 text-sm font-medium text-slate-700">Ir para:</div>

                    <div className="flex flex-wrap gap-2">
                      {missingList.slice(0, 60).map((questionNumber) => (
                        <button
                          key={questionNumber}
                          type="button"
                          onClick={() => {
                            setFinishStep(null)
                            goTo(questionNumber)
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {questionNumber}
                        </button>
                      ))}

                      {missingList.length > 60 && (
                        <span className="text-sm text-slate-500">+{missingList.length - 60}...</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFinishStep(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Continuar prova
                  </button>

                  {missingList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFinishStep('confirm')}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                      Finalizar assim mesmo
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-950">Confirmar finalizacao</h2>
                <p className="mt-2 text-sm text-slate-600">
                  As questoes nao respondidas serao contabilizadas como incorretas. Deseja finalizar
                  a prova mesmo assim?
                </p>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFinishStep('missing')}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFinishStep(null)
                      void finalizeAttempt()
                    }}
                    disabled={isFinishing}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isFinishing ? 'Finalizando...' : 'Confirmar finalizacao'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
