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
- year

## questions

Represents a single question.

Linked to:

- exam
- discipline
- topic

Question options are currently stored inline on the question row.

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

## Answering questions

Users may:

- answer
- change answers
- skip questions

Answers are saved explicitly during the runner flow.

## Finishing exam

If unanswered questions exist:

1. show modal listing missing questions
2. allow navigation to them
3. if user still wants to finish, show a second warning
4. unanswered questions count as incorrect

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

## Custom exam

The user can generate a custom attempt with filters such as:

- discipline
- topic
- banca
- year
- number of questions

Custom generation must happen server-side.

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
