const SAFE_E2E_EMAIL_PATTERN = /^e2e[+._-][a-z0-9._+-]+@(example\.(?:com|test|invalid)|(?:[a-z0-9-]+\.)?test|localhost)$/i

export function isSafeE2ETestEmail(email: string) {
  return SAFE_E2E_EMAIL_PATTERN.test(email.trim())
}
