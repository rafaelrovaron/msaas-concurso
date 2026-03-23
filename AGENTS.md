
# AGENTS.md

This file provides persistent instructions for AI coding agents working on this repository.

`README.md` is for humans.
This file is for agents.

Agents should prioritize practical, minimal, and verifiable actions.

---

# 1. Project identity

Project name: `micro-saas-mvp`

Product name (working name):
Concurso Boost

Product type:
Micro-SaaS for Brazilian public exam preparation.

Primary users:
Brazilian candidates studying for concursos públicos.

Primary goal:
Allow users to practice past exams, review mistakes, and track progress.

Primary UI language:
Portuguese (pt-BR)

Internal documentation:
Prefer English.

---

# 2. Product scope

The system has two main study modes.

## Full exam mode

Users select a real exam and solve all questions.

Filters available before starting:

- banca (organizer)
- órgão
- year
- cargo
- search text

Do NOT filter by discipline before starting a full exam.

Starting a full exam must:

- create an `attempt`
- persist question order
- redirect to attempt runner

---

## Custom exam mode

Users generate an exam dynamically.

Filters include:

- disciplina
- topic / subject
- banca
- year
- number of questions

Custom exams must:

- select questions server-side
- create an `attempt`
- store the question set
- persist the order

---

# 3. Attempt completion behavior

When user clicks Finish exam:

If all questions answered → finish normally.

If questions are unanswered:

1. show modal listing missing questions
2. allow navigation to them
3. if user confirms finishing anyway → show second warning
4. unanswered questions count as incorrect

---

# 4. Review behavior

"Only incorrect" review mode must include:

- incorrectly answered questions
- unanswered questions

---

# 5. Tech stack

Runtime:

Node.js v24.13.0
Package manager: npm

Frontend:

- Next.js 16
- React 19
- TypeScript 5
- Tailwind 4

Backend:

- Supabase
- Supabase SSR
- Supabase JS

Linting:

- ESLint
- eslint-config-next

---

# 6. Planned libraries

The following libraries are expected to be used:

- shadcn/ui
- Zod
- React Hook Form
- Playwright (E2E testing)

Agents may introduce them when justified.

---

# 7. Repository structure

micro-saas-mvp/
src/
app/
components/
lib/
supabase/

Rules:

- Pages and routes → src/app
- UI components → src/components
- Database utilities → src/lib
- Supabase client → src/lib/supabase

---

# 8. Architecture direction

The project should gradually move toward:

Clear separation between:

- UI
- business logic
- data access
- validation
- types

Future folders may include:

src/services
src/types
src/lib/utils
src/lib/validations

Create them only when justified.

---

# 9. UI rules

UI system must use:

shadcn/ui + Tailwind

Legacy UI components should gradually be replaced.

UX priorities:

- fast exam navigation
- clear question state
- visible progress
- minimal cognitive load

Accessibility must include:

- keyboard navigation
- visible focus states
- semantic HTML
- mobile usability

---

# 10. Data model expectations

Core entities:

users (Supabase auth)
exams
questions
question_options
attempts
attempt_answers

Recommended support table:

attempt_questions

Purpose:

- persist question order
- support custom exams
- avoid relying only on exam_id

---

# 11. Supabase security rules

Supabase Auth is the source of truth.

Never expose:

- service-role keys
- secrets

Use server-side operations for sensitive actions.

---

# 12. Row Level Security expectations

Ensure:

Users may only access:

- their own attempts
- their own answers
- their attempt-question mappings

Agents must not weaken RLS rules.

---

# 13. MCP servers

This repository uses MCP (Model Context Protocol) servers configured via:

.codex/config.toml

Installed MCP servers:

Context7
Playwright
Supabase
shadcn/ui
Filesystem

---

# 14. Code quality rules

TypeScript:

- avoid any
- prefer strong typing
- reuse domain types

Next.js:

Prefer Server Components.

Use Client Components only when needed.

---

# 15. Forms

Forms should use:

- React Hook Form
- Zod validation
- pt-BR error messages

---

# 16. State management

Prefer:

local state → first

Avoid global store unless justified.

---

# 17. Testing direction

Testing stack (planned):

- Playwright for E2E

Critical flows to test:

- attempt creation
- saving answers
- finish confirmation
- review filtering
- custom exam generation

---

# 18. Agent operating rules

Agents should:

- read existing code before editing
- preserve working behavior
- prefer small changes
- update docs when necessary

Agents must NOT:

- perform destructive database changes
- weaken security
- expose secrets
- rewrite large parts without justification

---

# 19. Local development

Install dependencies:

npm install

Run dev server:

npm run dev

Build:

npm run build

Lint:

npm run lint

Dev server URL:

http://localhost:3000

---

# 20. Agent workflow

Expected workflow:

1. read repository files
2. consult Context7 for documentation
3. inspect Supabase schema if needed
4. implement code
5. validate UI with Playwright when relevant
6. update documentation
