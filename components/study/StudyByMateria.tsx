'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Exam = {
  id: string
  concurso: string
  banca: string
  ano: number
  nota_corte: number
}

export default function StudyByMateria({
  materias,
}: {
  materias: string[]
}) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [materia, setMateria] = useState('')
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [startingExamId, setStartingExamId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadExamsForMateria = async (m: string) => {
    setError(null)
    setLoading(true)
    setExams([])

    // 1) pegar exam_ids que possuem essa materia
    const { data: qRows, error: qErr } = await supabase
      .from('questions')
      .select('exam_id')
      .eq('materia', m)

    if (qErr) {
      setError(qErr.message)
      setLoading(false)
      return
    }

    const examIds = Array.from(new Set((qRows ?? []).map((r) => r.exam_id))).filter(Boolean)

    if (examIds.length === 0) {
      setExams([])
      setLoading(false)
      return
    }

    // 2) buscar exams
    const { data: examsData, error: eErr } = await supabase
      .from('exams')
      .select('id, concurso, banca, ano, nota_corte')
      .in('id', examIds)
      .order('ano', { ascending: false })

    if (eErr) {
      setError(eErr.message)
      setLoading(false)
      return
    }

    setExams(examsData ?? [])
    setLoading(false)
  }

  const handleMateriaChange = async (value: string) => {
    setMateria(value)
    if (!value) {
      setExams([])
      return
    }
    await loadExamsForMateria(value)
  }

  const startStudy = async (examId: string) => {
    if (!materia) return

    setStartingExamId(examId)
    setError(null)

    const {
      data: { user },
      error: uErr,
    } = await supabase.auth.getUser()

    if (uErr) {
      setError(uErr.message)
      setStartingExamId(null)
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    const { data: attempt, error: aErr } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        exam_id: examId,
        materia,
      })
      .select('id')
      .single()

    if (aErr || !attempt) {
      setError(aErr?.message ?? 'Não foi possível iniciar o estudo.')
      setStartingExamId(null)
      return
    }

    router.push(`/dashboard/attempts/${attempt.id}?q=1`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Estudar por Matéria</h1>
        <p className="mt-1 text-sm text-gray-500">
          Escolha uma matéria e depois selecione uma prova para iniciar um estudo focado.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <label className="block text-sm text-gray-600 mb-2">Matéria</label>
        <select
          value={materia}
          onChange={(e) => handleMateriaChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          {materias.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6">
        {loading && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Carregando provas...
          </div>
        )}

        {!loading && materia && exams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">
              Nenhuma prova encontrada para essa matéria.
            </p>
          </div>
        )}

        {!loading && exams.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
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

                  <button
                    onClick={() => startStudy(exam.id)}
                    disabled={startingExamId === exam.id}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {startingExamId === exam.id ? 'Iniciando...' : 'Iniciar estudo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
