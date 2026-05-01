import { redirect } from 'next/navigation'
import CustomExamForm from '@/components/forms/CustomExamForm'
import { startCustomAttemptAction } from '@/lib/actions/attempts'
import { createClient } from '@/lib/supabase/server'

export default async function StudyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: questionMeta, error: questionMetaError }, { data: exams, error: examsError }] =
    await Promise.all([
      supabase.from('questions').select('discipline, topic'),
      supabase.from('exams').select('banca, ano'),
    ])

  if (questionMetaError || examsError) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Erro ao carregar filtros da prova customizada.</p>
      </div>
    )
  }

  const disciplines = Array.from(
    new Set(
      (questionMeta ?? [])
        .map((question) => question.discipline)
        .filter((discipline): discipline is string => Boolean(discipline))
    )
  ).sort()
  const topicsByDiscipline = Object.fromEntries(
    disciplines.map((discipline) => [
      discipline,
      Array.from(
        new Set(
          (questionMeta ?? [])
            .filter((question) => question.discipline === discipline)
            .map((question) => question.topic)
            .filter((topic): topic is string => Boolean(topic))
        )
      ).sort(),
    ])
  )
  const bancas = Array.from(
    new Set((exams ?? []).map((exam) => exam.banca).filter((banca): banca is string => Boolean(banca)))
  ).sort()
  const years = Array.from(new Set((exams ?? []).map((exam) => exam.ano))).sort((a, b) => b - a)

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prova customizada</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monte uma prova com disciplina, assunto, banca, ano e quantidade de questões.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <CustomExamForm
            disciplines={disciplines}
            topicsByDiscipline={topicsByDiscipline}
            bancas={bancas}
            years={years}
            startCustomAttempt={startCustomAttemptAction}
          />
        </div>
      </div>
    </div>
  )
}
