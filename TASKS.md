# TASKS.md - Concurso Boost

## 0. How to Use

- execute from top to bottom
- do not skip Priority 0 or Priority 1 items
- use `PRD.md` for strategic order
- use `AGENTS.md` for implementation rules
- use `DATABASE_CONTEXT.md` as schema truth

---

## 1. Priority 0 - Source Of Truth Alignment

Goal:

- make docs and execution order trustworthy before new feature work

Tasks:

- [x] Replace template `README.md` with project-specific setup and product overview
- [x] Rewrite `PRD.md` to match the actual codebase and schema
- [x] Rewrite `TASKS.md` to reflect real priorities
- [x] Align `AGENTS.md` data-model expectations with confirmed schema
- [x] Review `PROJECT_CONTEXT.md` for wording that implies unsupported schema fields
- [x] Ensure all docs consistently state that `orgao`, `cargo`, and `question_options` are not confirmed today

Deliverable:

- docs no longer contradict current implementation or schema

---

## 2. Priority 1 - Core Data Integrity

Goal:

- remove the highest-risk attempt lifecycle issues

Tasks:

- [x] Prevent answer updates after an attempt is finished
- [x] Prevent stale tabs from saving answers after finish
- [ ] Prevent duplicate finish operations
- [x] Make attempt creation atomic across `attempts` and `attempt_questions`
- [ ] Validate that `attempt_questions` remains the source of truth for composition and order
- [ ] Preserve the rule that unanswered questions are represented by missing answer rows, not placeholders

Suggested validation:

- finished attempts reject answer writes
- half-created attempts cannot remain in the database
- finish flow is idempotent

---

## 3. Priority 2 - Security And RLS Validation

Goal:

- confirm the current product model is enforced by Supabase, not only by UI behavior

Tasks:

- [ ] Validate ownership rules for attempts
- [ ] Validate ownership rules for answers
- [ ] Validate ownership rules for attempt-question mappings
- [ ] Review visible RLS policies through Supabase MCP
- [ ] Investigate `profiles` RLS warning noted in `DATABASE_CONTEXT.md`
- [ ] Review DB-side hardening opportunities for mutable functions and auth settings noted in advisors

Important:

- do not weaken existing RLS

---

## 4. Priority 3 - Type Safety And Client Typing

Goal:

- reduce manual casting and make data access safer

Tasks:

- [ ] Add `typecheck` script to `package.json`
- [ ] Generate Supabase types from the current schema
- [ ] Wire typed Supabase clients into app code
- [ ] Remove `as unknown as` casts where generated types can replace them
- [ ] Consolidate repeated attempt/question/answer types into shared domain types
- [ ] Reduce relation-normalization duplication where safe

Current note:

- TypeScript `strict` is already enabled, so this phase is about completing the typing strategy, not turning strict mode on

---

## 5. Priority 4 - Code Quality Baseline

Goal:

- make local quality checks explicit and clean

Tasks:

- [ ] Fix current lint warnings in `CustomExamForm`
- [ ] Run lint with zero warnings if feasible
- [ ] Keep `npm run build` passing
- [ ] Document expected local validation steps in `README.md`

---

## 6. Priority 5 - Core Product Corrections

Goal:

- resolve behavior mismatches between the product promise and implementation

Tasks:

- [ ] Define and implement real full-exam ordering semantics
- [ ] Stop implying faithful original exam order unless the data model supports it
- [ ] Decide how custom exam generation should behave when available questions are fewer than requested
- [ ] Improve user feedback for partial custom exam generation if that behavior remains allowed

---

## 7. Priority 6 - Study Experience Improvements

Goal:

- improve the user experience after core correctness is protected

Tasks:

- [ ] Improve exam detail page clarity
- [ ] Refine attempt resume UX
- [ ] Improve runner navigation polish
- [ ] Improve progress page UX and messaging
- [ ] Improve mobile usability where needed

Note:

- the progress page already exists; this is iteration work, not net-new creation

---

## 8. Priority 7 - Testing And CI

Goal:

- protect the main study loop from regression

Tasks:

- [ ] Setup Playwright
- [ ] Add E2E test for full exam attempt creation
- [ ] Add E2E test for custom exam generation
- [ ] Add E2E test for answer saving
- [ ] Add E2E test for finish confirmation with unanswered questions
- [ ] Add E2E test for review filter including unanswered questions
- [ ] Add CI pipeline for lint, typecheck, build, and critical E2E coverage

---

## 9. Priority 8 - Analytics

Goal:

- add visibility after the study engine is stable

Tasks:

- [ ] Choose analytics approach
- [ ] Track signup
- [ ] Track exam start
- [ ] Track attempt finish
- [ ] Track review usage
- [ ] Define basic event naming conventions

---

## 10. Priority 9 - Content Scaling

Goal:

- support operational growth later without disrupting the MVP

Tasks:

- [ ] Define admin role behavior
- [ ] Build admin panel
- [ ] Add CRUD for exams
- [ ] Add CRUD for questions
- [ ] Add content import system

---

## 11. Priority 10 - Monetization

Future only.

Tasks:

- [ ] Define pricing
- [ ] Integrate payments
- [ ] Add feature gating

Do not implement unless explicitly requested.

---

## 12. Current Active Queue

Execute these next unless priorities change:

- [ ] Add `typecheck` script
- [ ] Generate Supabase types
- [ ] Fix current lint warnings

---

## 13. Validation Checklist

Before closing a task batch:

- [ ] docs are still aligned
- [ ] lint passes
- [ ] build passes
- [ ] typecheck passes when added
- [ ] security assumptions were not weakened
- [ ] core attempt flows still work end-to-end
