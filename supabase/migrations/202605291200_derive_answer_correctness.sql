-- Ensure answer correctness is always derived server-side from the official
-- question answer, even when answers are written directly through Supabase REST.

create or replace function public.derive_answer_correctness()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_answer text;
begin
  select q.correta
  into expected_answer
  from public.questions q
  where q.id = new.question_id;

  if expected_answer is null then
    raise exception 'Question not found for answer correctness derivation.';
  end if;

  new.correta := new.resposta = expected_answer;

  return new;
end;
$$;

drop trigger if exists derive_answer_correctness on public.answers;

create trigger derive_answer_correctness
before insert or update of question_id, resposta, correta on public.answers
for each row
execute function public.derive_answer_correctness();

update public.answers answer
set correta = answer.resposta = question.correta
from public.questions question
where question.id = answer.question_id
  and answer.correta is distinct from (answer.resposta = question.correta)
  and exists (
    select 1
    from public.attempts attempt
    where attempt.id = answer.attempt_id
      and attempt.finished_at is null
  );
