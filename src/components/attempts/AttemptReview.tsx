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
  discipline: string | null
  topic: string | null
}

type Answer = {
  question_id: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
  correta: boolean | null
}

export default function AttemptReview({
  discipline,
  questions,
  answers,
}: {
  discipline: string | null
  questions: Question[]
  answers: Answer[]
}) {
  const [onlyWrong, setOnlyWrong] = useState(false)
  const [disciplineFilter, setDisciplineFilter] = useState('')

  const answerMap = useMemo(() => {
    const map = new Map<string, Answer>()
    for (const answer of answers) {
      map.set(answer.question_id, answer)
    }
    return map
  }, [answers])

  const disciplines = useMemo(() => {
    return Array.from(
      new Set(questions.map((question) => question.discipline).filter(Boolean))
    ).sort()
  }, [questions])

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      const answer = answerMap.get(question.id)
      const isWrong = !answer || answer.correta === false
      const passWrong = onlyWrong ? isWrong : true
      const passDiscipline = discipline
        ? true
        : disciplineFilter
          ? question.discipline === disciplineFilter
          : true

      return passWrong && passDiscipline
    })
  }, [questions, answerMap, onlyWrong, disciplineFilter, discipline])

  const renderAlternative = (
    label: 'A' | 'B' | 'C' | 'D' | 'E',
    text: string,
    chosen?: string,
    correct?: string
  ) => {
    const isChosen = chosen === label
    const isCorrect = correct === label

    const baseClassName = 'rounded-xl border px-4 py-3 text-sm'
    const className = isCorrect
      ? `${baseClassName} border-green-200 bg-green-50`
      : isChosen
        ? `${baseClassName} border-red-200 bg-red-50`
        : `${baseClassName} border-gray-200 bg-white`

    return (
      <div className={className}>
        <span className="font-medium text-gray-700">{label}.</span>{' '}
        <span className="text-gray-800">{text}</span>
        {isCorrect && <span className="ml-2 text-xs font-medium text-green-700">(correta)</span>}
        {isChosen && !isCorrect && (
          <span className="ml-2 text-xs font-medium text-red-700">(sua)</span>
        )}
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
            onChange={(event) => setOnlyWrong(event.target.checked)}
          />
          Somente incorretas e não respondidas
        </label>

        {!discipline && (
          <select
            value={disciplineFilter}
            onChange={(event) => setDisciplineFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
          >
            <option value="">Todas as disciplinas</option>
            {disciplines.map((item) => (
              <option key={item} value={item ?? ''}>
                {item}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-6">
        {filtered.map((question, index) => {
          const answer = answerMap.get(question.id)
          const chosen = answer?.resposta
          const correct = question.correta

          return (
            <div key={question.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="text-xs text-gray-500">
                {discipline ?? question.discipline ?? 'Sem disciplina'} • Questão {index + 1}/
                {filtered.length}
                {question.topic ? ` • ${question.topic}` : ''}
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">{question.enunciado}</p>

              <div className="mt-4 space-y-3">
                {renderAlternative('A', question.alternativa_a, chosen, correct)}
                {renderAlternative('B', question.alternativa_b, chosen, correct)}
                {renderAlternative('C', question.alternativa_c, chosen, correct)}
                {renderAlternative('D', question.alternativa_d, chosen, correct)}
                {renderAlternative('E', question.alternativa_e, chosen, correct)}
              </div>

              <div className="mt-4 text-sm">
                <div className="text-gray-700">
                  Sua resposta:{' '}
                  <span className="font-medium">{chosen ?? '— (não respondida)'}</span>
                </div>
                <div className="text-gray-700">
                  Correta: <span className="font-medium">{correct}</span>
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
