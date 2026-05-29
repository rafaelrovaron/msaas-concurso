# PROJECT_CONTEXT.md

This file provides additional context for AI agents working on this repository.

It complements AGENTS.md.

---

# Product overview

Product name:
Concurso Boost (working name)

Purpose:

Help Brazilian public exam candidates practice questions and track their learning progress.

The product focuses on practice through real past exams and custom generated sets.

---

# Core learning model

The platform revolves around attempts.

An attempt represents a user solving a fixed set of questions.

Attempts may originate from:

1. Full exams
2. Custom generated exams

Important rule:

- once created, an attempt must keep its own persisted question set and order

---

# Core entities

## exams

Represents a real public exam.

Currently confirmed fields include:

- concurso
- banca
- ano

Important current limitation:

- `orgao` is not confirmed in the current schema
- `cargo` is not confirmed in the current schema

## questions

Represents a single question.

Linked to:

- exam
- discipline
- topic
- `exam_position` for source-exam ordering

Question options are currently stored inline on the question row.

There is no confirmed `question_options` table in the current schema.

## attempts

Represents a user solving questions.

Important fields include:

- mode: `full_exam` or `custom`
- discipline when relevant
- filters JSON for generated attempts
- started_at
- finished_at

## attempt_answers

Product term for the physical `public.answers` table.

Stores answers for each question inside an attempt.

## attempt_questions

Stores the list of questions inside an attempt.

Purpose:

- persist order
- support custom exams
- avoid recalculating question sets

---

# Core flows

## Attempt creation

User selects:

- a full exam
or
- custom filters

System:

1. selects questions server-side
2. creates attempt
3. stores ordered question set in `attempt_questions`
4. redirects to the runner

Important implementation note:

- this is the intended flow and matches the schema direction
- the implementation should be hardened so attempt creation is atomic, not partially persisted

## Answering questions

Users may:

- answer
- change answers
- skip questions

Answers are saved explicitly during the runner flow.

Integrity rule:

- answers may be changed only before the attempt is finished
- after finish, further writes must be blocked even if the user still has an open tab

## Finishing exam

If unanswered questions exist:

1. show modal listing missing questions
2. allow navigation to them
3. if user still wants to finish, show a second warning
4. unanswered questions count as incorrect

Finish should also be:

- idempotent
- resistant to duplicate submits
- the boundary after which answer writes are no longer accepted

## Review mode

Review modes include:

- all questions
- only incorrect

The incorrect filter must include:

- wrong answers
- unanswered questions

---

# Study modes

## Full exam

The user starts from a specific exam and answers the full question set.

Important rule:

- do not filter a full exam by discipline before creating the attempt

Current schema note:

- `banca` and `ano` are supported today
- `cargo` is a future schema item and must not be assumed in current implementation

Ordering note:

- full-exam question selection should order by `questions.exam_position`
- the attempt must persist its own order in `attempt_questions`
- legacy rows backfilled by UUID are deterministic, but real imports should provide the true source-exam position

## Custom exam

The user can generate a custom attempt with filters such as:

- discipline
- topic
- banca
- year
- number of questions

Custom generation must happen server-side.

Inventory rule:

- if the available question set is smaller than the requested amount, the product must either surface a clear warning and generate a smaller attempt or block generation with an explicit error
- this behavior should be intentional and documented, not accidental

---

# UI principles

The UI should feel:

- modern
- clean
- distraction-free
- optimized for learning

UX priorities:

- fast exam navigation
- visible progress
- low cognitive load
- clear pending-question handling before finish

Current product note:

- a basic progress page already exists in the codebase
- future work in this area is iterative improvement, not initial delivery

---

# Technical priorities

Priorities for development:

1. stability
2. clarity
3. maintainability
4. performance

Avoid premature complexity.

---

# Long-term features

Possible future roadmap:

- spaced repetition
- performance analytics
- topic mastery tracking
- intelligent question recommendations
- flashcards from mistakes
- streak system
- study goals

Agents should not implement these unless explicitly requested.
