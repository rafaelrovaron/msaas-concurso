'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  materia: string
}

type InitialAnswer = {
  question_id: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
}

export default function AttemptRunner({
  attemptId,
  examTitle,
  notaCorte,
  materia,
  questions,
  initialAnswers,
  initialIndex,
}: {
  attemptId: string
  examTitle: string
  notaCorte: number | null
  materia: string | null
  questions: Question[]
  initialAnswers: InitialAnswer[]
  initialIndex: number
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const total = questions.length

  // ✅ respostaMap como STATE (para re-render e checagem dinâmica)
  const [answerMap, setAnswerMap] = useState(() => {
    const m = new Map<string, InitialAnswer['resposta']>()
    for (const a of initialAnswers) m.set(a.question_id, a.resposta)
    return m
  })

  const [index, setIndex] = useState(() => {
    const safe = Math.min(Math.max(initialIndex, 1), total)
    return safe
  })

  const current = questions[index - 1]

  const [selected, setSelected] = useState<InitialAnswer['resposta'] | ''>(() => {
    return answerMap.get(current.id) ?? ''
  })

  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // modal de faltantes
  const [missingOpen, setMissingOpen] = useState(false)
  const [missingList, setMissingList] = useState<number[]>([])

  const answeredCount = answerMap.size
  const missingCount = Math.max(0, total - answeredCount)
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0

  const getMissingQuestions = () => {
    const missing: number[] = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const answered = answerMap.get(q.id)
      if (!answered) missing.push(i + 1) // 1-based
    }
    return missing
  }

  const goTo = (nextIndex: number) => {
    const safe = Math.min(Math.max(nextIndex, 1), total)
    setIndex(safe)

    const nextQ = questions[safe - 1]
    setSelected(answerMap.get(nextQ.id) ?? '')
    setSavedMsg(null)
    setError(null)

    router.push(`/dashboard/attempts/${attemptId}?q=${safe}`)
  }

  const handleSave = async () => {
    setError(null)
    setSavedMsg(null)

    if (!selected) {
      setError('Selecione uma alternativa para salvar.')
      return
    }

    setSaving(true)

    const isCorrect = selected === current.correta

    const { error } = await supabase
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

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setAnswerMap((prev) => {
      const next = new Map(prev)
      next.set(current.id, selected)
      return next
    })

    setSavedMsg('Resposta salva ✅')
    setSaving(false)
  }

  const handleFinish = () => {
    const missing = getMissingQuestions()
    if (missing.length > 0) {
      setMissingList(missing)
      setMissingOpen(true)
      return
    }
    router.push(`/dashboard/attempts/${attemptId}/finish`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="text-sm text-gray-500">{examTitle}</div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">
            Questão {index}/{total}
          </h1>

          {materia && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {materia}
            </span>
          )}

          {notaCorte !== null && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              Nota corte: {notaCorte}
            </span>
          )}
        </div>

        {/* ✅ Indicador de progresso + links faltantes */}
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-gray-700">
                Respondidas: <span className="font-medium">{answeredCount}</span>/{total}{' '}
                <span className="text-gray-500">({progressPct}%)</span>
              </div>

              {missingCount > 0 ? (
                <div className="mt-1 text-sm text-gray-600">
                  Faltam <span className="font-medium">{missingCount}</span> questão(ões)
                </div>
              ) : (
                <div className="mt-1 text-sm text-green-700 font-medium">
                  Tudo respondido ✅ Você já pode finalizar.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const missing = getMissingQuestions()
                setMissingList(missing)
                setMissingOpen(true)
              }}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Ver pendentes
            </button>
          </div>

          {missingCount > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Ir para uma questão pendente:
              </div>

              <div className="flex flex-wrap gap-2">
                {getMissingQuestions().slice(0, 40).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goTo(n)}
                    className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    {n}
                  </button>
                ))}
                {getMissingQuestions().length > 40 && (
                  <span className="text-sm text-gray-500">
                    +{getMissingQuestions().length - 40}…
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card da questão */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500 mb-2">{current.materia}</div>

        <p className="text-base text-gray-900 whitespace-pre-wrap">
          {current.enunciado}
        </p>

        <div className="mt-6 space-y-3">
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
                className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  checked
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  className="mt-1"
                  checked={checked}
                  onChange={() => setSelected(letter)}
                />
                <span className="font-medium text-gray-700">{letter}.</span>
                <span className="text-gray-800">{text}</span>
              </label>
            )
          })}
        </div>

        {/* Mensagens */}
        <div className="mt-4 space-y-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {savedMsg && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {savedMsg}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 1}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === total}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Confirmar resposta'}
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Finalizar
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          O gabarito será mostrado apenas na revisão após finalizar.
        </p>
      </div>

      {/* ✅ Modal de pendentes */}
      {missingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Questões pendentes
            </h2>

            {missingList.length === 0 ? (
              <p className="mt-2 text-sm text-green-700 font-medium">
                Nenhuma pendente ✅ Você já pode finalizar.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Você ainda não respondeu {missingList.length} questão(ões).
                Para finalizar, responda todas.
              </p>
            )}

            {missingList.length > 0 && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-700 font-medium mb-2">
                  Ir para:
                </div>

                <div className="flex flex-wrap gap-2">
                  {missingList.slice(0, 60).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setMissingOpen(false)
                        goTo(n)
                      }}
                      className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      {n}
                    </button>
                  ))}

                  {missingList.length > 60 && (
                    <span className="text-sm text-gray-500">
                      +{missingList.length - 60}…
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMissingOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
              >
                Fechar
              </button>

              {missingList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMissingOpen(false)
                    goTo(missingList[0])
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Ir para a primeira pendente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
