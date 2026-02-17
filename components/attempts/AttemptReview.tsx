'use client'

import { useMemo, useState } from 'react'

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

type Answer = {
  question_id: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
  correta: boolean | null
}

export default function AttemptReview({
  attemptId,
  materia,
  questions,
  answers,
}: {
  attemptId: string
  materia: string | null
  questions: Question[]
  answers: Answer[]
}) {
  const [onlyWrong, setOnlyWrong] = useState(false)

  const answerMap = useMemo(() => {
    const m = new Map<string, Answer>()
    for (const a of answers) m.set(a.question_id, a)
    return m
  }, [answers])

  const materias = useMemo(() => {
    const set = new Set(questions.map((q) => q.materia))
    return Array.from(set).sort()
  }, [questions])

  const [materiaFilter, setMateriaFilter] = useState<string>('')

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const a = answerMap.get(q.id)
      const isWrong = !a || a.correta === false
      const passWrong = onlyWrong ? isWrong : true
      const passMateria = materia
        ? true // se attempt já é por matéria, não filtra aqui
        : materiaFilter
        ? q.materia === materiaFilter
        : true

      return passWrong && passMateria
    })
  }, [questions, answerMap, onlyWrong, materiaFilter, materia])

  const renderAlt = (label: 'A'|'B'|'C'|'D'|'E', text: string, chosen?: string, correct?: string) => {
    const isChosen = chosen === label
    const isCorrect = correct === label

    const base = 'rounded-xl border px-4 py-3 text-sm'
    const cls =
      isCorrect
        ? `${base} border-green-200 bg-green-50`
        : isChosen
        ? `${base} border-red-200 bg-red-50`
        : `${base} border-gray-200 bg-white`

    return (
      <div className={cls}>
        <span className="font-medium text-gray-700">{label}.</span>{' '}
        <span className="text-gray-800">{text}</span>
        {isCorrect && <span className="ml-2 text-xs font-medium text-green-700">(correta)</span>}
        {isChosen && !isCorrect && <span className="ml-2 text-xs font-medium text-red-700">(sua)</span>}
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyWrong}
            onChange={(e) => setOnlyWrong(e.target.checked)}
          />
          Somente erradas
        </label>

        {!materia && (
          <select
            value={materiaFilter}
            onChange={(e) => setMateriaFilter(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as matérias</option>
            {materias.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-6">
        {filtered.map((q, idx) => {
          const a = answerMap.get(q.id)
          const chosen = a?.resposta
          const correct = q.correta

          return (
            <div key={q.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="text-xs text-gray-500">
                {materia ? materia : q.materia} • Questão {idx + 1}/{filtered.length}
              </div>

              <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
                {q.enunciado}
              </p>

              <div className="mt-4 space-y-3">
                {renderAlt('A', q.alternativa_a, chosen, correct)}
                {renderAlt('B', q.alternativa_b, chosen, correct)}
                {renderAlt('C', q.alternativa_c, chosen, correct)}
                {renderAlt('D', q.alternativa_d, chosen, correct)}
                {renderAlt('E', q.alternativa_e, chosen, correct)}
              </div>

              <div className="mt-4 text-sm">
                <div className="text-gray-700">
                  Sua resposta:{' '}
                  <span className="font-medium">
                    {chosen ?? '— (não respondida)'}
                  </span>
                </div>
                <div className="text-gray-700">
                  Correta:{' '}
                  <span className="font-medium">{correct}</span>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">
              Nenhuma questão para mostrar com os filtros selecionados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
