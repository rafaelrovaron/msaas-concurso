import { expect, type Page, type TestInfo } from '@playwright/test'
import { isSafeE2ETestEmail } from '../src/lib/e2eSafety'

const email = process.env.E2E_TEST_EMAIL
const emailTemplate = process.env.E2E_TEST_EMAIL_TEMPLATE
const password = process.env.E2E_TEST_PASSWORD

export const hasE2ECredentials = Boolean((email || emailTemplate) && password)

export function getE2EEmail(workerIndex: number) {
  const candidate = emailTemplate?.replaceAll('{worker}', String(workerIndex)) ?? email

  if (!candidate || !password) {
    throw new Error('Missing E2E_TEST_EMAIL/E2E_TEST_EMAIL_TEMPLATE or E2E_TEST_PASSWORD for Playwright login.')
  }

  if (!isSafeE2ETestEmail(candidate)) {
    throw new Error(
      'E2E_TEST_EMAIL must be a synthetic test address such as e2e+worker0@example.test; never use a real user account.'
    )
  }

  return candidate
}

export async function login(page: Page, testInfo: TestInfo) {
  const workerEmail = getE2EEmail(testInfo.workerIndex)

  await page.goto('/login')
  await page.getByLabel('Email').fill(workerEmail)
  await page.getByLabel('Senha').fill(password!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}
