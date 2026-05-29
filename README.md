# Concurso Boost

Concurso Boost is a micro-SaaS for Brazilian public exam preparation.

The current MVP is focused on a stable study loop:

- choose a real exam or generate a custom one
- answer a fixed question set
- finish with pending-question confirmation
- review mistakes and unanswered questions
- track basic progress

## Current Scope

The app currently supports:

- authentication with Supabase Auth
- dashboard and study entry points
- full exam attempts
- custom exam attempts
- attempt runner with explicit answer saving
- finish flow with unanswered-question warnings
- review flow with "only incorrect" behavior
- basic progress page

Important product rules:

- full exam attempts must persist their own question order
- custom attempts must persist the selected question set and order
- unanswered questions count as incorrect on finish
- "only incorrect" review must include unanswered questions

## Tech Stack

- Node.js `v24.13.0`
- npm
- Next.js `16`
- React `19`
- TypeScript `5`
- Tailwind `4`
- Supabase

## Project Structure

```text
src/app          Next.js routes and pages
src/components   UI and feature components
src/lib          business logic, validations, utilities
src/lib/supabase Supabase clients
supabase         migrations and seeds
e2e              Playwright flows
.github          CI workflow
```

## Local Development

Install dependencies:

```bash
npm install
```

Create a local `.env.local` with the public Supabase browser/server values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Run the app:

```bash
npm run dev
```

Local URL:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test:e2e
npm run test:e2e:headed
```

## Validation

Current local validation baseline:

```bash
npm run lint
npm run typecheck
npm run build
```

Notes:

- `npm run lint` is expected to pass with zero warnings.
- `npm run typecheck` runs Next route type generation and strict TypeScript checking.
- `npm run build` requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` because dashboard routes create typed Supabase SSR clients during prerendering.
- `npm run test:e2e` requires the same Supabase env vars and runs authenticated flows only when `E2E_TEST_EMAIL`/`E2E_TEST_EMAIL_TEMPLATE` and `E2E_TEST_PASSWORD` are set.

## E2E Test Safety

Playwright tests must be deterministic and must never write to production data.

Required environment rules:

```bash
# Must point to a disposable local, preview, staging, or test Supabase project.
# Never point E2E runs at the production Supabase project.
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Enables the authenticated cleanup endpoint while the Playwright web server runs.
# The Playwright config sets this automatically for `npm run test:e2e`.
E2E_TEST_MODE=true

# Use a synthetic account only. Do not use an account that belongs to a real user.
# Accepted examples include e2e+worker0@example.test or e2e.worker0@example.com.
E2E_TEST_EMAIL=e2e+local@example.test
E2E_TEST_PASSWORD=...
```

For parallel worker isolation, prefer pre-created synthetic accounts and set a template instead of a single email:

```bash
E2E_TEST_EMAIL_TEMPLATE=e2e+worker{worker}@example.test
E2E_TEST_PASSWORD=...
```

When `E2E_TEST_EMAIL_TEMPLATE` is not set, Playwright runs with one worker so specs that share the same user cannot race each other. Every E2E email is validated by the test helper and cleanup endpoint; real personal, staging customer, or production user emails are rejected. Tests that create attempts register their attempt IDs and call the test-only cleanup route after each test. The route is disabled unless `E2E_TEST_MODE=true`, requires an authenticated synthetic E2E user, and deletes only attempts owned by that user.

## Documentation

Use these files as the main project references:

- `PRD.md` for product priorities and execution phases
- `TASKS.md` for the prioritized implementation queue
- `AGENTS.md` for implementation rules and constraints
- `PROJECT_CONTEXT.md` for flow behavior
- `DATABASE_CONTEXT.md` for confirmed schema and security notes

When documentation conflicts with actual schema assumptions, follow `DATABASE_CONTEXT.md`.

## Database Notes

Current confirmed schema notes:

- `banca` and `ano` are supported exam fields today
- `orgao` is not confirmed in the current schema
- `cargo` is a future schema item and should not be assumed in current implementation
- question options are stored inline on `questions`
- `questions.exam_position` is the intended full-exam ordering field going forward
- unanswered questions are represented by missing rows in `public.answers`
- `attempt_questions` is the source of truth for attempt composition and order
- `public.answers` has one row per answered attempt-question pair

## Current Priorities

The next priorities are:

1. apply and verify the latest Supabase integrity/RLS migrations
2. confirm production data has valid `questions.exam_position` values for real imported exams
3. keep CI green for lint, typecheck, build, and critical Playwright coverage
4. continue UX improvements only after the core study loop remains protected
