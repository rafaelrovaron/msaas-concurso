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

 - [x] Add `typecheck` script to `package.json`
 - [x] Generate Supabase types from the current schema
 - [x] Wire typed Supabase clients into app code
 - [x] Remove `as unknown as` casts where generated types can replace them
 - [ ] Consolidate repeated attempt/question/answer types into shared domain types
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
 - [x] Keep `npm run build` passing
 - [ ] Document expected local validation steps in `README.md`

---

## 6. Priority 5 - Core Product Corrections

Goal:

- resolve behavior mismatches between the product promise and implementation

Tasks:

- [ ] Define and implement real full-exam ordering semantics
 - [x] Stop implying faithful original exam order unless the data model supports it
 - [x] Decide how custom exam generation should behave when available questions are fewer than requested
 - [x] Improve user feedback for partial custom exam generation if that behavior remains allowed

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
 - [ ] Add E2E test for answer saving
 - [x] Add E2E test for finish confirmation with unanswered questions
 - [x] Add E2E test for review filter including unanswered questions
 - [ ] Add CI pipeline for lint, typecheck, build, and critical E2E coverage

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

 - [x] Add `typecheck` script
 - [x] Generate Supabase types
 - [x] Fix current lint warnings

---

## 14. Validation Checklist

Before closing a task batch:

- [ ] docs are still aligned
 - [x] lint passes
 - [x] build passes
 - [x] typecheck passes when added
- [ ] security assumptions were not weakened
- [ ] core attempt flows still work end-to-end
