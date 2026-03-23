'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Label from '@/components/ui/Label'
import { customExamSchema, type CustomExamFormValues } from '@/lib/validations/study'

type CustomExamFormProps = {
  disciplines: string[]
  topicsByDiscipline: Record<string, string[]>
  bancas: string[]
  years: number[]
  initialError?: string
  startCustomAttempt: (formData: FormData) => Promise<void>
}

export default function CustomExamForm({
  disciplines,
  topicsByDiscipline,
  bancas,
  years,
  initialError,
  startCustomAttempt,
}: CustomExamFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(initialError ?? null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomExamFormValues>({
    resolver: zodResolver(customExamSchema),
    defaultValues: {
      discipline: '',
      topic: '',
      banca: '',
      year: '',
      questionCount: '10',
    },
  })

  const selectedDiscipline = watch('discipline')
  const selectedTopic = watch('topic')
  const availableTopics = selectedDiscipline ? (topicsByDiscipline[selectedDiscipline] ?? []) : []

  useEffect(() => {
    if (selectedTopic && !availableTopics.includes(selectedTopic)) {
      setValue('topic', '')
    }
  }, [availableTopics, selectedTopic, setValue])

  const onSubmit = async (values: CustomExamFormValues) => {
    setSubmitError(null)

    const formData = new FormData()
    formData.set('discipline', values.discipline)
    formData.set('topic', values.topic ?? '')
    formData.set('banca', values.banca ?? '')
    formData.set('year', values.year ?? '')
    formData.set('questionCount', values.questionCount)

    await startCustomAttempt(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {submitError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</div>}

      <div className="space-y-1.5">
        <Label htmlFor="discipline">Disciplina</Label>
        <select
          id="discipline"
          {...register('discipline')}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="">Selecione uma disciplina</option>
          {disciplines.map((discipline) => (
            <option key={discipline} value={discipline}>
              {discipline}
            </option>
          ))}
        </select>
        {errors.discipline && <p className="text-sm text-red-600">{errors.discipline.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="topic">Assunto</Label>
          <select
            id="topic"
            {...register('topic')}
            disabled={!selectedDiscipline}
            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="">{selectedDiscipline ? 'Todos' : 'Selecione uma disciplina primeiro'}</option>
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="banca">Banca</Label>
          <select
            id="banca"
            {...register('banca')}
            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="">Todas</option>
            {bancas.map((banca) => (
              <option key={banca} value={banca}>
                {banca}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="year">Ano</Label>
          <select
            id="year"
            {...register('year')}
            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="">Todos</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="questionCount">Quantidade de questoes</Label>
          <select
            id="questionCount"
            {...register('questionCount')}
            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {['10', '20', '30', '40'].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          {errors.questionCount && <p className="text-sm text-red-600">{errors.questionCount.message}</p>}
        </div>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting} loadingText="Gerando...">
        Gerar prova personalizada
      </Button>
    </form>
  )
}
