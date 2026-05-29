import { expect, test } from '@playwright/test'
import { cleanupAttempts, getAttemptIdFromPage } from './attempt-cleanup'
import { hasE2ECredentials, login } from './auth'

test.describe('custom exam flow', () => {
  let createdAttemptIds: Set<string>

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!hasE2ECredentials, 'Set E2E_TEST_EMAIL/E2E_TEST_EMAIL_TEMPLATE and E2E_TEST_PASSWORD to run Playwright flows.')
    createdAttemptIds = new Set<string>()
    await login(page, testInfo)
  })

  test.afterEach(async ({ page }) => {
    await cleanupAttempts(page, createdAttemptIds)
  })

  test('shows shortage modal and lets the user return to filters', async ({ page }) => {
    await page.goto('/dashboard/study')
    await page.getByLabel('Disciplina').selectOption({ label: 'Legislacao' })
    await page.getByLabel('Assunto').selectOption({ label: 'LGPD' })
    await page.getByLabel('Quantidade de questões').selectOption('10')
    await page.getByRole('button', { name: 'Gerar prova personalizada' }).click()

    await expect(
      page.getByRole('heading', { name: 'Banco insuficiente para a quantidade solicitada' })
    ).toBeVisible()
    await expect(page.getByText(/Você pediu 10 questões/)).toBeVisible()

    await page.getByRole('button', { name: 'Voltar e ajustar filtros' }).click()
    await expect(
      page.getByRole('heading', { name: 'Banco insuficiente para a quantidade solicitada' })
    ).not.toBeVisible()
    await expect(page).toHaveURL(/\/dashboard\/study$/)
  })

  test('creates a reduced custom exam after explicit confirmation', async ({ page }) => {
    await page.goto('/dashboard/study')
    await page.getByLabel('Disciplina').selectOption({ label: 'Legislacao' })
    await page.getByLabel('Assunto').selectOption({ label: 'LGPD' })
    await page.getByLabel('Quantidade de questões').selectOption('10')
    await page.getByRole('button', { name: 'Gerar prova personalizada' }).click()

    const confirmButton = page.getByRole('button', { name: /Gerar com \d+ questões/ })
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()

    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)
    createdAttemptIds.add(getAttemptIdFromPage(page) ?? '')
    await expect(page.getByText('Prova personalizada')).toBeVisible()
  })
})
