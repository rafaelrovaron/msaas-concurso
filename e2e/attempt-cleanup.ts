import { expect, type Page } from '@playwright/test'

const ATTEMPT_URL_PATTERN = /\/dashboard\/attempts\/([^/]+)/

export function getAttemptIdFromPage(page: Page) {
  const match = page.url().match(ATTEMPT_URL_PATTERN)
  return match?.[1] ?? null
}

export async function cleanupAttempts(page: Page, attemptIds: Iterable<string>) {
  const uniqueAttemptIds = [...new Set([...attemptIds].filter(Boolean))]

  if (uniqueAttemptIds.length === 0) {
    return
  }

  const response = await page.request.post('/api/test/cleanup-attempts', {
    data: { attemptIds: uniqueAttemptIds },
  })

  expect(response.ok(), await response.text()).toBeTruthy()
}
