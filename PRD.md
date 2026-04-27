# PRD.md - Concurso Boost

## 1. Purpose

This document defines the current product direction and execution priorities.

- `PRD.md` -> product goals, status, priorities
- `AGENTS.md` -> implementation guardrails
- `PROJECT_CONTEXT.md` -> flow and UX behavior
- `DATABASE_CONTEXT.md` -> confirmed schema and security facts

When there is a conflict about current database reality, `DATABASE_CONTEXT.md` is the source of truth.

---

## 2. Product Overview

Concurso Boost is a micro-SaaS for Brazilian public exam preparation focused on:

- full exam simulation
- custom exam generation
- structured attempt workflow
- mistake-driven review
- progress visibility

Core loop:

> select -> solve -> finish -> review -> improve

---

## 3. Problem

Users face:

- fragmented study material
- poor practice structure
- weak mistake review loops
- limited visibility into performance

The MVP should solve this with a stable practice engine before expanding into analytics, admin tooling, or monetization.

---

## 4. Product Goal

Short term:

- stabilize the study engine
- remove data integrity risks
- align docs, code, and schema

Mid term:

- improve learning efficiency
- strengthen progress visibility
- add reliable automated validation

Long term:

- become a daily study platform

---

## 5. Core Product Scope

### Full exam mode

Users select a real exam and solve its full question set.

Current intended behavior:

- create an `attempt`
- persist question order in `attempt_questions`
- redirect to the runner
- do not filter by discipline before starting

Important schema note:

- `banca` and `ano` are confirmed today
- `orgao` and `cargo` are not confirmed in the current schema and must not drive implementation until added to Supabase

### Custom exam mode

Users generate an exam dynamically using supported filters.

Confirmed supported filters today:

- `discipline`
- `topic`
- `banca`
- `year`
- question count

Current intended behavior:

- select questions server-side
- create an `attempt`
- persist the question set in `attempt_questions`
- persist the generated order
- redirect to the runner

### Attempt runner

Users can:

- answer questions
- change answers before finishing
- navigate between questions
- save answers explicitly

### Attempt completion

When the user finishes:

- if all questions are answered, finish normally
- if there are unanswered questions, show missing items first
- allow navigation back to missing items
- require a second confirmation before finishing anyway
- count unanswered questions as incorrect

### Review

Review must support:

- all questions
- only incorrect

"Only incorrect" must include:

- incorrectly answered questions
- unanswered questions

### Progress

Progress tracking exists in the app today, but is still basic and should be treated as an early MVP view rather than a finished analytics feature.

---

## 6. Current Status

### Implemented in the codebase

- [x] Authentication
- [x] Dashboard
- [x] Exam listing
- [x] Exam detail page
- [x] Full exam flow
- [x] Custom exam flow
- [x] Attempt runner
- [x] Answer persistence
- [x] Finish flow with missing-question confirmation
- [x] Review flow
- [x] Basic progress page

### Partially complete or risky

- [ ] Full exam order fidelity is not guaranteed yet
- [ ] Attempt creation is not atomic
- [ ] Post-finish answer immutability is not guaranteed yet
- [ ] Duplicate finish protection needs hardening at the data layer
- [ ] Supabase clients are not fully typed from generated schema
- [ ] Some domain typing is duplicated or normalized manually
- [ ] README is still template content
- [ ] Playwright coverage is not in place

### Not started

- [ ] Analytics
- [ ] Admin tools
- [ ] Content import workflows
- [ ] SEO
- [ ] Monetization

---

## 7. Product Constraints

- UI language should remain pt-BR
- internal docs can remain in English
- prefer Server Components when possible
- preserve RLS and user isolation
- do not weaken security to move faster
- do not build future monetization or admin scope before stabilizing core study flows

---

## 8. Execution Priorities

### Phase 1 - Alignment and hardening

Goal:

- make docs, typing, and core behavior trustworthy

Priority items:

- align project docs with actual schema and implementation
- replace template README
- generate Supabase types
- add explicit typecheck workflow
- remove unsafe manual typing hotspots
- fix current lint warnings

### Phase 2 - Data integrity

Goal:

- make the attempt lifecycle safe and predictable

Priority items:

- prevent answer changes after finish
- prevent duplicate or racing finish flows
- make attempt creation atomic
- validate ownership and RLS expectations
- add missing constraints or DB-side protections where justified

### Phase 3 - Study experience

Goal:

- improve UX only after the core loop is safe

Priority items:

- guarantee full exam ordering semantics
- improve exam detail clarity
- improve custom exam feedback when available questions are below requested count
- strengthen attempt resume and runner usability
- refine progress UX

### Phase 4 - Testing and CI

Goal:

- protect the core loop from regression

Priority items:

- add Playwright
- cover attempt creation
- cover answer saving
- cover finish confirmation
- cover review filtering
- cover custom exam generation
- add CI checks

### Phase 5 - Analytics

Goal:

- add product visibility after the core engine is stable

Priority items:

- track signup
- track exam start
- track attempt finish
- track review usage

### Phase 6 - Content scaling

Goal:

- support operational growth without destabilizing the MVP

Priority items:

- admin role model
- admin panel
- CRUD for exams and questions
- import pipeline

### Phase 7 - Monetization

Future only.

Do not implement unless explicitly prioritized.

---

## 9. Prioritization Rules

1. Fix core loop and data risks before adding features.
2. Follow confirmed schema, not assumptions.
3. Prefer simpler, verifiable changes over broad rewrites.
4. Stabilize behavior before polishing visuals.
5. Add testing once the intended core behavior is settled.

---

## 10. Definition of Done

Work is done when it:

- works end-to-end
- follows `AGENTS.md`
- respects `PROJECT_CONTEXT.md`
- matches confirmed schema in `DATABASE_CONTEXT.md`
- does not break existing flows
- is strongly typed
- passes lint
- passes build
- includes tests when the task justifies them

---

## 11. Strategic Direction

Do not restart the project.

Current strategy:

> align -> harden -> validate -> expand
