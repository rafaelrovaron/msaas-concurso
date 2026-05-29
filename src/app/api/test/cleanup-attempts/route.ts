import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSafeE2ETestEmail } from '@/lib/e2eSafety'

type CleanupRequestBody = {
  attemptIds?: unknown
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseAttemptIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((item): item is string => typeof item === 'string' && UUID_PATTERN.test(item)))]
}

export async function POST(request: Request) {
  if (process.env.E2E_TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Test cleanup endpoint is disabled.' }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as CleanupRequestBody
  const attemptIds = parseAttemptIds(body.attemptIds)

  if (attemptIds.length === 0) {
    return NextResponse.json({ cleaned: 0 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email || !isSafeE2ETestEmail(user.email)) {
    return NextResponse.json({ error: 'Test cleanup requires a safe synthetic E2E user.' }, { status: 403 })
  }

  const { data: cleaned, error: cleanupError } = await supabase.rpc('cleanup_test_attempts', {
    p_attempt_ids: attemptIds,
  })

  if (cleanupError) {
    return NextResponse.json({ error: cleanupError.message }, { status: 500 })
  }

  return NextResponse.json({ cleaned: cleaned ?? 0 })
}
