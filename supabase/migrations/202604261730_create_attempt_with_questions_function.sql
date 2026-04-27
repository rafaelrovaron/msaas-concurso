create or replace function public.create_attempt_with_questions(
  p_user_id uuid,
  p_mode text,
  p_question_ids uuid[],
  p_exam_id uuid default null,
  p_discipline text default null,
  p_filters jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  new_attempt_id uuid;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized.';
  end if;

  if p_question_ids is null or coalesce(array_length(p_question_ids, 1), 0) = 0 then
    raise exception 'Attempt must contain at least one question.';
  end if;

  insert into public.attempts (
    user_id,
    exam_id,
    mode,
    discipline,
    filters
  )
  values (
    p_user_id,
    p_exam_id,
    p_mode,
    p_discipline,
    p_filters
  )
  returning id into new_attempt_id;

  insert into public.attempt_questions (
    attempt_id,
    question_id,
    position
  )
  select
    new_attempt_id,
    question_id,
    position
  from unnest(p_question_ids) with ordinality as ordered_questions(question_id, position);

  return new_attempt_id;
end;
$$;
