alter table public.answers
drop constraint if exists answers_attempt_question_fkey;

alter table public.answers
add constraint answers_attempt_question_fkey
foreign key (attempt_id, question_id)
references public.attempt_questions (attempt_id, question_id)
on delete cascade
not valid;

create or replace function public.finish_attempt(p_attempt_id uuid)
returns boolean
language plpgsql
security invoker
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
  where id = p_attempt_id;

  if not found then
    raise exception 'Attempt not found.';
  end if;

  if target_attempt.user_id is distinct from auth.uid() then
    raise exception 'Unauthorized.';
  end if;

  if target_attempt.finished_at is not null then
    return true;
  end if;

  with locked_attempt as (
    select id
    from public.attempts
    where id = p_attempt_id
      and finished_at is null
    for update
  ),
  summary as (
    select
      count(aq.question_id)::integer as total,
      count(ans.id) filter (where ans.correta is true)::integer as correct
    from public.attempt_questions aq
    left join public.answers ans
      on ans.attempt_id = aq.attempt_id
     and ans.question_id = aq.question_id
    where aq.attempt_id in (select id from locked_attempt)
  )
  select
    coalesce(total, 0),
    coalesce(correct, 0)
  into total_questions, correct_answers
  from summary;

  if total_questions is null then
    return true;
  end if;

  percent_score :=
    case
      when total_questions > 0 then round((correct_answers::numeric / total_questions::numeric) * 100)
      else 0
    end;

  update public.attempts
  set
    score = correct_answers,
    passed =
      case
        when total_questions > 0 then percent_score >= 70
        else null
      end,
    finished_at = now()
  where id = p_attempt_id
    and finished_at is null;

  return true;
end;
$$;
