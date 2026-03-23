alter table public.questions
  rename column materia to discipline;

alter table public.attempts
  rename column materia to discipline;

alter table public.questions
  add column topic text;

alter table public.attempts
  alter column exam_id drop not null,
  add column mode text not null default 'full_exam',
  add column filters jsonb not null default '{}'::jsonb,
  add constraint attempts_mode_check check (mode in ('full_exam', 'custom'));

create table public.attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id),
  unique (attempt_id, position)
);

create index questions_exam_id_idx on public.questions (exam_id);
create index attempts_exam_id_idx on public.attempts (exam_id);
create index answers_question_id_idx on public.answers (question_id);
create index attempt_questions_attempt_position_idx on public.attempt_questions (attempt_id, position);
create index attempt_questions_question_idx on public.attempt_questions (question_id);

alter table public.attempt_questions enable row level security;

create policy "Read own attempt questions"
on public.attempt_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.attempts
    where attempts.id = attempt_questions.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);

create policy "Insert own attempt questions"
on public.attempt_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.attempts
    where attempts.id = attempt_questions.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);
