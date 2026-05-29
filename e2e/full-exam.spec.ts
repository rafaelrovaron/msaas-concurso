import { expect, test } from '@playwright/test'
import { cleanupAttempts, getAttemptIdFromPage } from './attempt-cleanup'
import { hasE2ECredentials, login } from './auth'

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

    await expect(page.getByRole('heading', { name: 'Questoes pendentes' })).toBeVisible()
    await page.getByRole('button', { name: 'Finalizar assim mesmo' }).click()
    await expect(page.getByRole('heading', { name: 'Confirmar finalizacao' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar finalizacao' }).click()

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
    await page.getByRole('button', { name: 'Proxima' }).click()
    await expect(page.getByRole('heading', { name: /Questao 2 de/ })).toBeVisible()
    await page.getByRole('button', { name: 'Anterior' }).click()

    await expect(page.getByRole('radio').first()).toBeChecked()
  })

  test('review keeps unanswered questions in only-wrong mode', async ({ page }) => {
    await page.goto('/dashboard/exams')
    await page.getByRole('link', { name: 'Ver prova' }).first().click()
    await page.getByRole('button', { name: 'Iniciar prova completa' }).click()
    await expect(page).toHaveURL(/\/dashboard\/attempts\/.+/)
    createdAttemptIds.add(getAttemptIdFromPage(page) ?? '')
    await page.getByRole('button', { name: 'Finalizar' }).click()
    await page.getByRole('button', { name: 'Finalizar assim mesmo' }).click()
    await page.getByRole('button', { name: 'Confirmar finalizacao' }).click()

    await page.getByRole('link', { name: 'Ver revisão' }).click()
    await page.getByLabel('Somente incorretas e não respondidas').check()

    await expect(page.getByText('Sua resposta:')).toBeVisible()
    await expect(page.getByText(/não respondida/i).first()).toBeVisible()
  })
})
