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
- [x] Document current local validation steps and required Supabase env vars in `README.md`

Deliverable:

- docs no longer contradict current implementation or schema

---

## 2. Priority 1 - Core Data Integrity

Goal:

- remove the highest-risk attempt lifecycle issues

Tasks:

- [x] Prevent answer updates after an attempt is finished
- [x] Prevent stale tabs from saving answers after finish
- [x] Prevent duplicate finish operations with an idempotent DB-backed finish function
- [x] Make attempt creation atomic across `attempts` and `attempt_questions`
- [x] Validate that `attempt_questions` remains the source of truth for composition and order
- [x] Preserve the rule that unanswered questions are represented by missing answer rows, not placeholders
- [x] Enforce one answer row per attempt-question pair with a database unique constraint
- [x] Validate the FK from `answers` to `attempt_questions`

Suggested validation:

- finished attempts reject answer writes
- half-created attempts cannot remain in the database
- finish flow is idempotent
- unanswered questions remain absent from `public.answers`

---

## 3. Priority 2 - Security And RLS Validation

Goal:

- confirm the current product model is enforced by Supabase, not only by UI behavior

Tasks:

- [x] Add/confirm ownership policies for attempts
- [x] Add/confirm ownership policies for answers
- [x] Keep ownership policies for attempt-question mappings
- [x] Add basic own-profile policies for `profiles`
- [ ] Verify the deployed Supabase project with Supabase MCP/advisors after migrations are applied
- [ ] Run cross-user access checks against a seeded staging project

Important:

- do not weaken existing RLS
- users must only access their own attempts, answers, and attempt-question mappings

---

## 4. Priority 3 - Type Safety And Client Typing

Goal:

- reduce manual casting and make data access safer

Tasks:

- [x] Add `typecheck` script to `package.json`
- [x] Generate Supabase types from the current schema
- [x] Wire typed Supabase clients into app code
- [x] Remove `as unknown as` casts where generated types can replace them
- [x] Consolidate repeated attempt/question/answer types into shared domain types
- [ ] Reduce relation-normalization duplication where safe

Current note:

- TypeScript `strict` is already enabled, so this phase is about completing the typing strategy, not turning strict mode on

---

## 5. Priority 4 - Code Quality Baseline

Goal:

- make local quality checks explicit and clean

Tasks:

- [x] Fix current lint warnings in `CustomExamForm`
- [x] Run lint with zero warnings if feasible
- [x] Keep `npm run build` passing when required Supabase env vars are present
- [x] Document expected local validation steps in `README.md`

---

## 6. Priority 5 - Core Product Corrections

Goal:

- resolve behavior mismatches between the product promise and implementation

Tasks:

- [x] Define and implement real full-exam ordering semantics with `questions.exam_position`
- [x] Stop implying faithful original exam order unless the data model supports it
- [x] Decide how custom exam generation should behave when available questions are fewer than requested
- [x] Improve user feedback for partial custom exam generation if that behavior remains allowed

Follow-up:

- existing legacy question rows are backfilled deterministically by UUID; production imports should populate `exam_position` with the real exam order

---

## 7. Priority 6 - Question Bank And Admin Import

Goal:

- build the operational foundation for scaling real exam content through admin workflows and assisted import, without weakening review and publication controls

Tasks:

- [ ] Define admin role behavior and access boundaries
- [ ] Create protected admin area for authorized users
- [ ] Create admin question listing
- [ ] Create manual question creation flow
- [ ] Create question editing flow
- [ ] Create question removal or deactivation flow
- [ ] Define publication status model for imported/manual questions
- [ ] Prevent non-published questions from being shown to users
- [ ] Create PDF upload flow for previous exams
- [ ] Create import record tracking and processing status
- [ ] Track source exam/PDF provenance for imported questions
- [ ] Design extraction flow for question statement, alternatives, and answer key
- [ ] Add admin review flow for imported questions before publication
- [ ] Add admin correction flow for extracted answer keys and categorization
- [ ] Support exam board categorization in admin workflows
- [ ] Support subject categorization in admin workflows
- [ ] Support topic categorization in admin workflows
- [ ] Evaluate AI-assisted extraction and categorization with mandatory human review
- [ ] Avoid assuming every question uses the same option format
- [ ] Plan user-facing filter expansion by exam board, subject, and topic after publication flow is stable

Important:

- use real previous exams as the primary source of content
- do not prioritize AI-generated brand-new questions
- do not publish imported content without human review
- inspect real schema and RLS before proposing data-model changes

Sequencing note:

- begin implementation only after the current core study-loop blockers are at an acceptable level
- if execution starts earlier, phase work so publication safeguards and access control land before broad admin tooling

---

## 8. Priority 7 - Study Experience Improvements

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

## 9. Priority 8 - Testing And CI

Goal:

- protect the main study loop from regression

Tasks:

- [x] Setup Playwright
- [x] Add E2E test for full exam attempt creation
- [x] Add E2E test for custom exam generation
- [x] Add E2E test for answer saving
- [x] Add E2E test for finish confirmation with unanswered questions
- [x] Add E2E test for review filter including unanswered questions
- [x] Add CI pipeline for lint, typecheck, build, and critical E2E coverage

---

## 10. Priority 9 - Analytics

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

## 11. Priority 10 - Content Scaling

Goal:

- scale operational throughput after the first admin/import foundation is working

Tasks:

- [ ] Improve bulk review workflows for imported questions
- [ ] Add batch publish/reject actions
- [ ] Add admin productivity tooling for large imports
- [ ] Improve import quality monitoring and recovery flows
- [ ] Expand supported source formats beyond the initial PDF flow

---

## 12. Priority 11 - Monetization

Future only.

Tasks:

- [ ] Define pricing
- [ ] Integrate payments
- [ ] Add feature gating

Do not implement unless explicitly requested.

---

## 13. Current Active Queue

Execute these next unless priorities change:

- [ ] Apply the new Supabase migrations to staging/production
- [ ] Verify RLS policies and Supabase advisors after deployment
- [ ] Confirm real imported exams populate `questions.exam_position`
- [ ] Keep CI secrets configured for build and E2E

---

## 14. Validation Checklist

Before closing a task batch:

- [x] docs are still aligned
- [x] lint passes
- [x] typecheck passes
- [x] build passes with Supabase env vars present
- [ ] security assumptions were verified against deployed Supabase
- [ ] core attempt flows still work end-to-end with E2E credentials
