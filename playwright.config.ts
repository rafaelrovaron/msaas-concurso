import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const workers = process.env.E2E_TEST_EMAIL_TEMPLATE ? undefined : 1

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'list',
  retries: process.env.CI ? 2 : 0,
  workers,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'E2E_TEST_MODE=true npm run dev',
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
