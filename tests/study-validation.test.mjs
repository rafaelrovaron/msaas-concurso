import assert from 'node:assert/strict'
import test from 'node:test'

import { customAttemptInputSchema } from '../src/lib/validations/study.ts'

const validInput = {
  banca: null,
  discipline: 'Direito Constitucional',
  questionCount: 10,
  topic: null,
  year: null,
}

test('normalizes custom attempt input from forged form-like values', () => {
  const parsed = customAttemptInputSchema.safeParse({
    banca: ' Cebraspe ',
    confirmed: true,
    discipline: ' Direito Administrativo ',
    questionCount: '20',
    topic: '',
    year: '2024',
  })

  assert.equal(parsed.success, true)
  assert.deepEqual(parsed.data, {
    banca: 'Cebraspe',
    confirmed: true,
    discipline: 'Direito Administrativo',
    questionCount: 20,
    topic: null,
    year: 2024,
  })
})

test('normalizes omitted optional custom attempt filters to null', () => {
  const parsed = customAttemptInputSchema.safeParse({
    discipline: 'Português',
    questionCount: 30,
  })

  assert.equal(parsed.success, true)
  assert.deepEqual(parsed.data, {
    banca: null,
    discipline: 'Português',
    questionCount: 30,
    topic: null,
    year: null,
  })
})

test('rejects forged invalid custom attempt payloads', () => {
  const forgedPayloads = [
    { ...validInput, questionCount: 0 },
    { ...validInput, questionCount: -10 },
    { ...validInput, questionCount: 1000 },
    { ...validInput, discipline: '' },
  ]

  for (const payload of forgedPayloads) {
    const parsed = customAttemptInputSchema.safeParse(payload)

    assert.equal(parsed.success, false, `payload should fail: ${JSON.stringify(payload)}`)
  }
})
