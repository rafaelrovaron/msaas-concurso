import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { hasE2ECredentials, login } from './auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseRestCredentials = Boolean(supabaseUrl && supabaseAnonKey)

type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E'

async function getSupabaseAccessToken(page: Page) {
  return page.evaluate(() => {
    for (let storageIndex = 0; storageIndex < window.localStorage.length; storageIndex += 1) {
      const key = window.localStorage.key(storageIndex)

      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue

      const value = window.localStorage.getItem(key)
      if (!value) continue

      const parsed = JSON.parse(value) as { access_token?: string }
      if (parsed.access_token) return parsed.access_token
    }

    return null
  })
}

function restHeaders(accessToken: string) {
  return {
    apikey: supabaseAnonKey!,
    Authorization: `Bearer ${accessToken}`,
  }
}

async function getJson<T>(request: APIRequestContext, path: string, accessToken: string) {
  const response = await request.get(`${supabaseUrl}/rest/v1/${path}`, {
    headers: restHeaders(accessToken),
  })

  expect(response.ok()).toBeTruthy()
  return (await response.json()) as T
}

function wrongAnswerFor(correctAnswer: AnswerOption): AnswerOption {
  return correctAnswer === 'A' ? 'B' : 'A'
}

test.describe('full exam flow', () => {
  let createdAttemptIds: Set<string>

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!hasE2ECredentials, 'Set E2E_TEST_EMAIL/E2E_TEST_EMAIL_TEMPLATE and E2E_TEST_PASSWORD to run Playwright flows.')
    createdAttemptIds = new Set<string>()
    await login(page, testInfo)
  })

  test.afterEach(async ({ page }) => {
    await cleanupAttempts(page, createdAttemptIds)
  })

  test('starts a full exam and blocks finish with unanswered warnings first', async ({ page }) => {
    await page.goto('/dashboard/exams')
    await page.getByRole('link', { name: 'Ver prova' }).first().click()
    await page.getByRole('button', { name: 'Iniciar prova completa' }).click()

    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)
    createdAttemptIds.add(getAttemptIdFromPage(page) ?? '')
    await page.getByRole('button', { name: 'Finalizar' }).click()

    await expect(page.getByRole('heading', { name: 'Questões pendentes' })).toBeVisible()
    await page.getByRole('button', { name: 'Finalizar assim mesmo' }).click()
    await expect(page.getByRole('heading', { name: 'Confirmar finalização' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar finalização' }).click()

    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+\/finish$/)
    await expect(page.getByText('Não respondidas:')).toBeVisible()
  })

  test('saves an answer and keeps it when navigating away and back', async ({ page }) => {
    await page.goto('/dashboard/exams')
    await page.getByRole('link', { name: 'Ver prova' }).first().click()
    await page.getByRole('button', { name: 'Iniciar prova completa' }).click()

    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)
    createdAttemptIds.add(getAttemptIdFromPage(page) ?? '')
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Salvar resposta' }).click()

    await expect(page.getByText('Resposta salva.')).toBeVisible()
    await page.getByRole('button', { name: 'Próxima' }).click()
    await expect(page.getByRole('heading', { name: /Questão 2 de/ })).toBeVisible()
    await page.getByRole('button', { name: 'Anterior' }).click()

    await expect(page.getByRole('radio').first()).toBeChecked()
  })

  test('derives correctness when direct REST payload lies with correta=true', async ({ page, request }) => {
    test.skip(
      !hasSupabaseRestCredentials,
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to run Supabase REST checks.'
    )

    await page.goto('/dashboard/exams')
    await page.getByRole('link', { name: 'Ver prova' }).first().click()
    await page.getByRole('button', { name: 'Iniciar prova completa' }).click()

    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)

    const attemptId = new URL(page.url()).pathname.split('/').at(-1)
    expect(attemptId).toBeTruthy()

    const accessToken = await getSupabaseAccessToken(page)
    expect(accessToken).toBeTruthy()

    const attemptQuestions = await getJson<Array<{ question_id: string }>>(
      request,
      `attempt_questions?attempt_id=eq.${attemptId}&position=eq.1&select=question_id`,
      accessToken!
    )
    expect(attemptQuestions).toHaveLength(1)

    const questions = await getJson<Array<{ correta: AnswerOption }>>(
      request,
      `questions?id=eq.${attemptQuestions[0].question_id}&select=correta`,
      accessToken!
    )
    expect(questions).toHaveLength(1)

    const resposta = wrongAnswerFor(questions[0].correta)
    const answerResponse = await request.post(
      `${supabaseUrl}/rest/v1/answers?on_conflict=attempt_id,question_id`,
      {
        data: {
          attempt_id: attemptId,
          question_id: attemptQuestions[0].question_id,
          resposta,
          correta: true,
        },
        headers: {
          ...restHeaders(accessToken!),
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
      }
    )

    expect(answerResponse.ok()).toBeTruthy()
    const persistedAnswers = (await answerResponse.json()) as Array<{ correta: boolean }>
    expect(persistedAnswers[0].correta).toBe(false)

    const finishResponse = await request.post(`${supabaseUrl}/rest/v1/rpc/finish_attempt`, {
      data: { p_attempt_id: attemptId },
      headers: {
        ...restHeaders(accessToken!),
        'Content-Type': 'application/json',
      },
    })
    expect(finishResponse.ok()).toBeTruthy()

    const attempts = await getJson<Array<{ score: number }>>(
      request,
      `attempts?id=eq.${attemptId}&select=score`,
      accessToken!
    )
    expect(attempts).toEqual([{ score: 0 }])
  })

  test('review keeps unanswered questions in only-wrong mode', async ({ page }) => {
    await page.goto('/dashboard/exams')
    await page.getByRole('link', { name: 'Ver prova' }).first().click()
    await page.getByRole('button', { name: 'Iniciar prova completa' }).click()
    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)
    createdAttemptIds.add(getAttemptIdFromPage(page) ?? '')
    await page.getByRole('button', { name: 'Finalizar' }).click()
    await page.getByRole('button', { name: 'Finalizar assim mesmo' }).click()
    await page.getByRole('button', { name: 'Confirmar finalização' }).click()

    await page.getByRole('link', { name: 'Ver revisão' }).click()
    await page.getByLabel('Somente incorretas e não respondidas').check()

    await expect(page.getByText('Sua resposta:')).toBeVisible()
    await expect(page.getByText(/não respondida/i).first()).toBeVisible()
  })
})
