import { expect, type Page, type TestInfo } from '@playwright/test'
import { isSafeE2ETestEmail } from '../src/lib/e2eSafety'

function resolveE2ECredentials(workerIndex = 0) {
  const emailTemplate = process.env.E2E_TEST_EMAIL_TEMPLATE
  const email = emailTemplate?.replaceAll('{worker}', String(workerIndex)) ?? process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  return { email, password }
}

export const hasE2ECredentials = Boolean(
  (process.env.E2E_TEST_EMAIL || process.env.E2E_TEST_EMAIL_TEMPLATE) &&
    process.env.E2E_TEST_PASSWORD
)

export function getE2EEmail(workerIndex: number) {
  const { email, password } = resolveE2ECredentials(workerIndex)

  if (!email || !password) {
    throw new Error('Missing E2E_TEST_EMAIL/E2E_TEST_EMAIL_TEMPLATE or E2E_TEST_PASSWORD for Playwright login.')
  }

  if (!isSafeE2ETestEmail(email)) {
    throw new Error(
      'E2E_TEST_EMAIL must be a synthetic test address such as e2e+worker0@example.test; never use a real user account.'
    )
  }

  return email
}

export async function login(page: Page, testInfo: TestInfo) {
  const { email, password } = resolveE2ECredentials(testInfo.workerIndex)

  if (!email || !password) {
    throw new Error('Missing E2E_TEST_EMAIL/E2E_TEST_EMAIL_TEMPLATE or E2E_TEST_PASSWORD for Playwright login.')
  }

  if (!isSafeE2ETestEmail(email)) {
    throw new Error(
      'E2E_TEST_EMAIL must be a synthetic test address such as e2e+worker0@example.test; never use a real user account.'
    )
  }

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}
