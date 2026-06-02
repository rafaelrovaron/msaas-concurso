-- Test-only cleanup helper used by authenticated Playwright flows.
-- The application only exposes the route that calls this function when
-- E2E_TEST_MODE=true, and the function itself rejects non-synthetic emails.

create or replace function public.prevent_finished_attempt_question_writes()
returns trigger
language plpgsql
as $$
declare
  target_attempt_id uuid;
  target_finished_at timestamptz;
begin
  if current_setting('app.cleanup_test_attempts', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

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

create or replace function public.cleanup_test_attempts(p_attempt_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer := 0;
  requester_email text := coalesce(auth.jwt() ->> 'email', '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if requester_email !~* '^e2e[+._-][a-z0-9._+-]+@(example\.(com|test|invalid)|([a-z0-9-]+\.)?test|localhost)$' then
    raise exception 'cleanup_test_attempts requires a synthetic E2E user email.';
  end if;

  perform set_config('app.cleanup_test_attempts', 'on', true);

  with deleted as (
    delete from public.attempts
    where user_id = auth.uid()
      and id = any(p_attempt_ids)
    returning id
  )
  select count(*)::integer
  into deleted_count
  from deleted;

  return deleted_count;
end;
$$;

grant execute on function public.cleanup_test_attempts(uuid[]) to authenticated;
