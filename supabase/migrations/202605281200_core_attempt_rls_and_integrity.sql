-- Harden the core attempt lifecycle so Supabase enforces the same
-- ownership and immutability rules expected by the application.

alter table public.attempts enable row level security;
alter table public.answers enable row level security;
alter table public.profiles enable row level security;

-- One answer row represents one answered attempt-question pair. Unanswered
-- questions continue to be represented by a missing row in public.answers.
-- This migration intentionally does not delete/merge duplicate historical rows;
-- if duplicates exist, the unique constraint will fail and data must be reviewed.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.answers'::regclass
      and conname = 'answers_attempt_question_key'
  ) then
    alter table public.answers
    add constraint answers_attempt_question_key
    unique (attempt_id, question_id);
  end if;
end $$;

alter table public.answers
validate constraint answers_attempt_question_fkey;

create or replace function public.prevent_finished_attempt_question_writes()
returns trigger
language plpgsql
as $$
declare
  target_attempt_id uuid;
  target_finished_at timestamptz;
begin
  target_attempt_id := coalesce(new.attempt_id, old.attempt_id);

  select finished_at
  into target_finished_at
  from public.attempts
  where id = target_attempt_id;

  if target_finished_at is not null then
    raise exception 'Attempt is already finished.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_finished_attempt_question_writes on public.attempt_questions;

create trigger prevent_finished_attempt_question_writes
before insert or update or delete on public.attempt_questions
for each row
execute function public.prevent_finished_attempt_question_writes();

create or replace function public.finish_attempt(p_attempt_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_attempt public.attempts%rowtype;
  total_questions integer;
  correct_answers integer;
  percent_score integer;
begin
  select *
  into target_attempt
  from public.attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'Attempt not found.';
  end if;

  if target_attempt.user_id is distinct from auth.uid() then
    raise exception 'Unauthorized.';
  end if;

  if target_attempt.finished_at is not null then
    return true;
  end if;

  select
    count(aq.question_id)::integer,
    count(ans.id) filter (where ans.correta is true)::integer
  into total_questions, correct_answers
  from public.attempt_questions aq
  left join public.answers ans
    on ans.attempt_id = aq.attempt_id
   and ans.question_id = aq.question_id
  where aq.attempt_id = p_attempt_id;

  if coalesce(total_questions, 0) = 0 then
    raise exception 'Attempt must contain at least one question.';
  end if;

  percent_score := round((correct_answers::numeric / total_questions::numeric) * 100);

  update public.attempts
  set
    score = correct_answers,
    passed = percent_score >= 70,
    finished_at = now()
  where id = p_attempt_id
    and finished_at is null;

  return true;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'attempts'
      and policyname = 'Read own attempts'
  ) then
    create policy "Read own attempts"
    on public.attempts
    for select
    to authenticated
    using (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'attempts'
      and policyname = 'Insert own attempts'
  ) then
    create policy "Insert own attempts"
    on public.attempts
    for insert
    to authenticated
    with check (user_id = (select auth.uid()));
  end if;


  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'answers'
      and policyname = 'Read own answers'
  ) then
    create policy "Read own answers"
    on public.answers
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.attempts
        where attempts.id = answers.attempt_id
          and attempts.user_id = (select auth.uid())
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'answers'
      and policyname = 'Insert own answers'
  ) then
    create policy "Insert own answers"
    on public.answers
    for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.attempts
        where attempts.id = answers.attempt_id
          and attempts.user_id = (select auth.uid())
          and attempts.finished_at is null
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'answers'
      and policyname = 'Update own answers before finish'
  ) then
    create policy "Update own answers before finish"
    on public.answers
    for update
    to authenticated
    using (
      exists (
        select 1
        from public.attempts
        where attempts.id = answers.attempt_id
          and attempts.user_id = (select auth.uid())
          and attempts.finished_at is null
      )
    )
    with check (
      exists (
        select 1
        from public.attempts
        where attempts.id = answers.attempt_id
          and attempts.user_id = (select auth.uid())
          and attempts.finished_at is null
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Read own profile'
  ) then
    create policy "Read own profile"
    on public.profiles
    for select
    to authenticated
    using (id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Update own profile'
  ) then
    create policy "Update own profile"
    on public.profiles
    for update
    to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));
  end if;
end $$;
