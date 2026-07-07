import { expect, test } from '@playwright/test'
import { cleanupAttempts, getAttemptIdFromPage } from './attempt-cleanup'
import { findCustomExamShortageFilter, hasE2EDatabaseConfig } from './custom-exam-data'
import { hasE2ECredentials, login } from './auth'

const requestedQuestionCount = 10

test.describe('custom exam flow', () => {
  test.skip(
    !hasE2ECredentials,
    'Set E2E_TEST_EMAIL/E2E_TEST_EMAIL_TEMPLATE and E2E_TEST_PASSWORD to run Playwright flows.'
  )
  test.skip(
    !hasE2EDatabaseConfig,
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to discover E2E question data.'
  )

  let createdAttemptIds: Set<string>

  test.beforeEach(async ({ page }, testInfo) => {
    createdAttemptIds = new Set<string>()
    await login(page, testInfo)
  })

  test.afterEach(async ({ page }) => {
    await cleanupAttempts(page, createdAttemptIds)
  })

  test('shows shortage modal and lets the user return to filters', async ({ page }) => {
    const shortageFilter = await findCustomExamShortageFilter(requestedQuestionCount)
    test.skip(
      !shortageFilter,
      `Seed a controlled custom-exam dataset with a discipline/topic that has fewer than ${requestedQuestionCount} questions.`
    )

    await page.goto('/dashboard/study')
    await page.getByLabel('Disciplina').selectOption({ label: shortageFilter.discipline })
    await page.getByLabel('Assunto').selectOption({ label: shortageFilter.topic })
    await page.getByLabel('Quantidade de questões').selectOption(String(requestedQuestionCount))
    await page.getByRole('button', { name: 'Gerar prova personalizada' }).click()

    await expect(
      page.getByRole('heading', { name: 'Banco insuficiente para a quantidade solicitada' })
    ).toBeVisible()
    await expect(page.getByText(`Você pediu ${requestedQuestionCount} questões`)).toBeVisible()
    await expect(page.getByText(String(shortageFilter.availableQuestionCount))).toBeVisible()

    await page.getByRole('button', { name: 'Voltar e ajustar filtros' }).click()
    await expect(
      page.getByRole('heading', { name: 'Banco insuficiente para a quantidade solicitada' })
    ).not.toBeVisible()
    await expect(page).toHaveURL(/\/dashboard\/study$/)
  })

  test('creates a reduced custom exam after explicit confirmation', async ({ page }) => {
    const shortageFilter = await findCustomExamShortageFilter(requestedQuestionCount)
    test.skip(
      !shortageFilter,
      `Seed a controlled custom-exam dataset with a discipline/topic that has fewer than ${requestedQuestionCount} questions.`
    )

    await page.goto('/dashboard/study')
    await page.getByLabel('Disciplina').selectOption({ label: shortageFilter.discipline })
    await page.getByLabel('Assunto').selectOption({ label: shortageFilter.topic })
    await page.getByLabel('Quantidade de questões').selectOption(String(requestedQuestionCount))
    await page.getByRole('button', { name: 'Gerar prova personalizada' }).click()

    const confirmButton = page.getByRole('button', {
      name: `Gerar com ${shortageFilter.availableQuestionCount} questões`,
    })
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()

    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)
    createdAttemptIds.add(getAttemptIdFromPage(page) ?? '')
    await expect(page.getByText('Prova personalizada')).toBeVisible()
  })
})
