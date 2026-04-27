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
```

## Local Development

Install dependencies:

```bash
npm install
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
```

## Validation

Current local validation baseline:

```bash
npm run lint
npm run build
```

Notes:

- `npm run build` is currently passing
- `npm run lint` currently reports warnings that are tracked in `TASKS.md`
- a dedicated `typecheck` script is still pending

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
- unanswered questions are represented by missing rows in `public.answers`
- `attempt_questions` is the source of truth for attempt composition and order

## Current Priorities

The next priorities are:

1. harden attempt data integrity
2. validate RLS and ownership rules
3. generate typed Supabase clients
4. improve test coverage for the core study loop
