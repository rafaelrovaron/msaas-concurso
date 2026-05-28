-- Persist the intended order of questions inside each source exam.
-- Existing rows are backfilled deterministically by UUID because no original
-- ordering field existed before this migration. New imports must provide the
-- real exam order through public.questions.exam_position.

alter table public.questions
add column if not exists exam_position integer;

with ranked_questions as (
  select
    id,
    row_number() over (partition by exam_id order by id)::integer as position
  from public.questions
  where exam_position is null
)
update public.questions q
set exam_position = ranked_questions.position
from ranked_questions
where ranked_questions.id = q.id;

alter table public.questions
alter column exam_position set not null;

alter table public.questions
drop constraint if exists questions_exam_position_check;

alter table public.questions
add constraint questions_exam_position_check check (exam_position > 0);

alter table public.questions
drop constraint if exists questions_exam_position_key;

alter table public.questions
add constraint questions_exam_position_key unique (exam_id, exam_position);

create index if not exists questions_exam_position_idx
on public.questions (exam_id, exam_position);
