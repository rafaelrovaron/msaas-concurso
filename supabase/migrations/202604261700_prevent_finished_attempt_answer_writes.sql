create or replace function public.prevent_finished_attempt_answer_writes()
returns trigger
language plpgsql
as $$
declare
  target_finished_at timestamptz;
begin
  select finished_at
  into target_finished_at
  from public.attempts
  where id = new.attempt_id;

  if target_finished_at is not null then
    raise exception 'Attempt is already finished.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_finished_attempt_answer_writes on public.answers;

create trigger prevent_finished_attempt_answer_writes
before insert or update on public.answers
for each row
execute function public.prevent_finished_attempt_answer_writes();
