import { redirect } from 'next/navigation'
import CustomExamForm from '@/components/forms/CustomExamForm'
import { createCustomAttempt } from '@/lib/attempts'
import { createClient } from '@/lib/supabase/server'

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
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
    new Set((questionMeta ?? []).map((question) => question.discipline).filter(Boolean))
  ).sort()
  const topicsByDiscipline = Object.fromEntries(
    disciplines.map((discipline) => [
      discipline,
      Array.from(
        new Set(
          (questionMeta ?? [])
            .filter((question) => question.discipline === discipline)
            .map((question) => question.topic)
            .filter(Boolean)
        )
      ).sort(),
    ])
  )
  const bancas = Array.from(new Set((exams ?? []).map((exam) => exam.banca).filter(Boolean))).sort()
  const years = Array.from(new Set((exams ?? []).map((exam) => exam.ano))).sort((a, b) => b - a)

  async function startCustomAttempt(formData: FormData) {
    'use server'

    const discipline = String(formData.get('discipline') ?? '').trim()
    const topic = String(formData.get('topic') ?? '').trim() || null
    const banca = String(formData.get('banca') ?? '').trim() || null
    const yearRaw = String(formData.get('year') ?? '').trim()
    const questionCountRaw = Number(formData.get('questionCount') ?? 10)
    const year = yearRaw ? Number(yearRaw) : null

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    if (topic && !topicsByDiscipline[discipline]?.includes(topic)) {
      redirect(
        `/dashboard/study?error=${encodeURIComponent(
          'Selecione um assunto valido para a disciplina escolhida.'
        )}`
      )
    }

    let attemptId: string

    try {
      const attempt = await createCustomAttempt({
        supabase,
        userId: user.id,
        discipline,
        topic,
        banca,
        year: Number.isNaN(year) ? null : year,
        questionCount: Number.isNaN(questionCountRaw) ? 10 : questionCountRaw,
      })

      attemptId = attempt.id
    } catch (attemptError) {
      const message =
        attemptError instanceof Error
          ? attemptError.message
          : 'Nao foi possivel gerar a prova personalizada.'

      redirect(`/dashboard/study?error=${encodeURIComponent(message)}`)
    }

    redirect(`/dashboard/attempts/${attemptId}`)
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prova customizada</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monte uma prova com disciplina, assunto, banca, ano e quantidade de questoes.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <CustomExamForm
            disciplines={disciplines}
            topicsByDiscipline={topicsByDiscipline}
            bancas={bancas}
            years={years}
            initialError={error}
            startCustomAttempt={startCustomAttempt}
          />
        </div>
      </div>
    </div>
  )
}
