'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Label from '@/components/ui/Label'
import type { CustomAttemptInput, StartCustomAttemptResult } from '@/lib/attempts'
import { customExamSchema, type CustomExamFormValues } from '@/lib/validations/study'

type CustomExamFormProps = {
  disciplines: string[]
  topicsByDiscipline: Record<string, string[]>
  bancas: string[]
  years: number[]
  startCustomAttempt: (input: CustomAttemptInput) => Promise<StartCustomAttemptResult>
}

type PendingConfirmationState = {
  availableQuestionCount: number
  request: CustomAttemptInput
  requestedQuestionCount: number
}

export default function CustomExamForm({
  disciplines,
  topicsByDiscipline,
  bancas,
  years,
  startCustomAttempt,
}: CustomExamFormProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmationState | null>(
    null
  )

  const {
    control,
    register,
    handleSubmit,
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

  const selectedDiscipline = useWatch({
    control,
    name: 'discipline',
  })
  const selectedTopic = useWatch({
    control,
    name: 'topic',
  })
  const availableTopics = useMemo(
    () => (selectedDiscipline ? (topicsByDiscipline[selectedDiscipline] ?? []) : []),
    [selectedDiscipline, topicsByDiscipline]
  )

  useEffect(() => {
    if (selectedTopic && !availableTopics.includes(selectedTopic)) {
      setValue('topic', '')
    }
  }, [availableTopics, selectedTopic, setValue])

  const runStartAttempt = async (request: CustomAttemptInput, confirmed: boolean) => {
    setSubmitError(null)
    setIsProcessing(true)

    const result = await startCustomAttempt({
      ...request,
      confirmed,
    })

    setIsProcessing(false)

    if (result.status === 'created') {
      setPendingConfirmation(null)
      router.push(`/dashboard/attempts/${result.attemptId}`)
      return
    }

    if (result.status === 'needs_confirmation') {
      setPendingConfirmation({
        availableQuestionCount: result.availableQuestionCount,
        request,
        requestedQuestionCount: result.requestedQuestionCount,
      })
      return
    }

    setPendingConfirmation(null)
    setSubmitError(result.message)
  }

  const onSubmit = async (values: CustomExamFormValues) => {
    setPendingConfirmation(null)
    await runStartAttempt(
      {
        banca: values.banca ? values.banca : null,
        discipline: values.discipline,
        questionCount: Number(values.questionCount),
        topic: values.topic ? values.topic : null,
        year: values.year ? Number(values.year) : null,
      },
      false
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</div>
        )}

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
              <option value="">
                {selectedDiscipline ? 'Todos' : 'Selecione uma disciplina primeiro'}
              </option>
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
            <Label htmlFor="questionCount">Quantidade de questões</Label>
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
            {errors.questionCount && (
              <p className="text-sm text-red-600">{errors.questionCount.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting || isProcessing}
          loadingText="Gerando..."
        >
          Gerar prova personalizada
        </Button>
      </form>

      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-exam-confirmation-title"
            className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl shadow-slate-950/20"
          >
            <h2
              id="custom-exam-confirmation-title"
              className="text-lg font-semibold text-slate-950"
            >
              Banco insuficiente para a quantidade solicitada
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Você pediu{' '}
              <span className="font-semibold text-slate-950">
                {pendingConfirmation.requestedQuestionCount} questões
              </span>
              , mas com os filtros atuais existem apenas{' '}
              <span className="font-semibold text-slate-950">
                {pendingConfirmation.availableQuestionCount}
              </span>
              .
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Você pode gerar a prova com a quantidade disponível ou voltar para ajustar os
              filtros.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingConfirmation(null)}
                disabled={isProcessing}
              >
                Voltar e ajustar filtros
              </Button>
              <Button
                type="button"
                onClick={() => void runStartAttempt(pendingConfirmation.request, true)}
                loading={isProcessing}
                loadingText="Gerando..."
              >
                Gerar com {pendingConfirmation.availableQuestionCount} questões
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
