# DATABASE_CONTEXT.md

This file provides database context for AI agents working on this repository.

It is based only on schema details confirmed through the Supabase MCP for project `pdcntbiyzzlvuhhkuihe`.

It complements `AGENTS.md` and `PROJECT_CONTEXT.md`.

---

# Scope

Confirmed source:

- Supabase MCP schema inspection
- table metadata
- columns
- primary keys
- foreign keys
- visible indexes
- visible RLS flags and policies
- Supabase advisors output

Not included:

- undocumented runtime behavior
- assumptions presented as facts

---

# Naming guidance

When discussing the current schema:

- use `discipline` for the renamed field previously called `materia`
- use `public.answers` for the physical answers table
- use `attempt_answers` only as product terminology

---

# Confirmed public tables

## public.exams

Purpose:

- stores exam records referenced by questions and full-exam attempts

Confirmed columns:

- `id uuid`
- `concurso text`
- `banca text`
- `ano integer`
- `nota_corte integer`
- `created_at timestamptz`

RLS:

- enabled

Visible policy pattern:

- public read policies exist
- admin full-access policy exists

Important observations:

- there is still no confirmed `orgao` column
- there is still no confirmed `cargo` column

---

## public.questions

Purpose:

- stores question records

Confirmed columns:

- `id uuid`
- `exam_id uuid`
- `enunciado text`
- `alternativa_a text`
- `alternativa_b text`
- `alternativa_c text`
- `alternativa_d text`
- `alternativa_e text`
- `correta bpchar`
- `discipline text`
- `topic text`
- `exam_position integer`

Relationships:

- `exam_id -> public.exams.id`

Important observations:

- options are stored inline on the question row
- there is no confirmed `question_options` table
- `topic` now exists and can support custom-exam filtering
- `exam_position` is the intended source-exam ordering field for full-exam attempts

---

## public.attempts

Purpose:

- stores full and custom attempts

Confirmed columns:

- `id uuid`
- `user_id uuid`
- `exam_id uuid nullable`
- `discipline text nullable`
- `mode text`
- `filters jsonb`
- `score integer`
- `passed boolean`
- `started_at timestamptz`
- `finished_at timestamptz`

Relationships:

- `exam_id -> public.exams.id`

Important observations:

- `mode` is constrained to `full_exam` or `custom`
- `finished_at` is the completion marker
- `filters` stores generation metadata for custom attempts
- `exam_id` is nullable so a custom attempt does not need to belong to a single exam

---

## public.attempt_questions

Purpose:

- persists the exact question set and order of each attempt

Confirmed columns:

- `id uuid`
- `attempt_id uuid`
- `question_id uuid`
- `position integer`
- `created_at timestamptz`

Relationships:

- `attempt_id -> public.attempts.id`
- `question_id -> public.questions.id`

Constraints:

- unique `(attempt_id, question_id)`
- unique `(attempt_id, position)`
- `position > 0`

Integrity:

- writes are blocked after the parent attempt is finished

RLS:

- enabled

Visible policy pattern:

- authenticated users can read and insert mappings only for their own attempts

---

## public.answers

Purpose:

- stores one answer per question inside an attempt

Confirmed columns:

- `id uuid`
- `attempt_id uuid`
- `question_id uuid`
- `resposta bpchar`
- `correta boolean`

Relationships:

- `attempt_id -> public.attempts.id`
- `question_id -> public.questions.id`
- composite `(attempt_id, question_id) -> public.attempt_questions(attempt_id, question_id)`

Constraints:

- unique `(attempt_id, question_id)`

RLS:

- enabled
- authenticated users can read/insert/update answer rows only for their own unfinished attempts

Important observations:

- there is no `answered_at` column
- unanswered state still means no answer row exists for that attempt-question pair
- answer writes are blocked after finish by database trigger

---

## public.profiles

Purpose:

- stores app profile data linked to Supabase Auth users

Confirmed columns:

- `id uuid`
- `role text`
- `created_at timestamptz`

Relationship:

- `id -> auth.users.id`

RLS:

- enabled

Visible policy pattern:

- authenticated users can read and update their own profile

---

# Confirmed relationships

- `questions.exam_id -> exams.id`
- `attempts.exam_id -> exams.id`
- `attempt_questions.attempt_id -> attempts.id`
- `attempt_questions.question_id -> questions.id`
- `answers.attempt_id -> attempts.id`
- `answers.question_id -> questions.id`
- `answers(attempt_id, question_id) -> attempt_questions(attempt_id, question_id)`
- `profiles.id -> auth.users.id`

Practical meaning:

- full-exam attempts may point to a single exam
- custom attempts persist their question set through `attempt_questions`
- review and finish flows can rely on `attempt_questions` instead of reconstructing from `questions`

---

# Flow implications

## Attempt creation

The schema now supports the intended creation flow:

1. select questions server-side
2. for full exams, order questions by `questions.exam_position`
3. create the attempt row
4. insert ordered `attempt_questions`
5. redirect to the runner

## Finish flow

The schema now supports reliable unanswered detection because:

- total expected questions come from `attempt_questions`
- answered questions come from `answers`
- unanswered questions are still represented by missing answer rows
- finishing is idempotent: a finished attempt returns success without recomputing

## Review flow

"Only incorrect" review should include:

- rows in `answers` where `correta = false`
- questions present in `attempt_questions` that have no answer row

## Custom exam flow

The schema now supports:

- filtering by `discipline`
- optional filtering by `topic`
- optional filtering by related exam metadata such as `banca` and `ano`
- persistence of generated question sets and their order

---

# Current security and performance notes

Before the latest local hardening migrations, security advisors reported:

- `public.profiles` with RLS enabled and no visible policy
- `public.handle_new_user` with mutable `search_path`
- leaked password protection disabled in Supabase Auth

After applying migrations, rerun Supabase advisors because the profile-policy warning should be resolved by the own-profile policies. Auth-level warnings still require Supabase project configuration.

Performance advisors previously reported:

- duplicate permissive policies on `attempts`, `answers`, `exams`, and `questions`
- multiple RLS policies that should use `(select auth.uid())` style init plans
- several indexes not yet used, which is expected immediately after creation on an empty database

These observations should be rechecked after deployment and should not be ignored in future hardening work.

---

# Agent guidance

When working in this repository:

- prefer `discipline` over legacy `materia`
- treat `attempt_questions` as the source of truth for attempt composition and order
- do not assume `orgao` or `cargo` exist in the current schema
- do not assume `public.answers` stores unanswered placeholders
- preserve RLS expectations that users only access their own attempts, answers, and attempt-question mappings


## Operational validation notes

After applying migrations to a Supabase project, verify:

- RLS policies still restrict `attempts`, `answers`, and `attempt_questions` to the authenticated owner
- `profiles` no longer appears as RLS-enabled without an own-profile policy
- duplicate calls to `finish_attempt` return success without creating placeholder answers
- attempts cannot receive new `answers` or `attempt_questions` rows after `finished_at` is set
- imported real exams populate `questions.exam_position` with the real exam order
