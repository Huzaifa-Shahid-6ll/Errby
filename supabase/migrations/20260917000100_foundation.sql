-- Schema baseline. Client writes are denied; authorised server mutations come
-- with the product flows and their integration tests, not with the UI preview.
create table public.profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'learner' check (role in ('learner', 'teacher')),
  alias text not null check (char_length(alias) between 1 and 80),
  grade_band text check (grade_band in ('primary', 'middle_school', 'high_school')),
  setup_mode text not null default 'assisted' check (setup_mode in ('assisted', 'independent')),
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  grade_band text not null,
  active boolean not null default true,
  join_code_hash text not null,
  join_code_rotated_at timestamptz not null default now(),
  unique (id, teacher_id)
);

create table public.memberships (
  class_id uuid not null references public.classes on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  alias_in_class text not null,
  joined_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'removed')),
  primary key (class_id, student_id)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  class_id uuid,
  kind text not null check (kind in ('text', 'topic', 'pdf', 'docx', 'webpage', 'youtube')),
  storage_path text,
  original_url text,
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'extracting', 'ready', 'partial', 'failed', 'needs_text')),
  content_hash text,
  provenance jsonb not null default '{}'::jsonb,
  retention_until timestamptz not null default now() + interval '7 days',
  foreign key (class_id, owner_id) references public.classes(id, teacher_id) on delete cascade
);

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_documents on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  text text not null,
  location jsonb not null default '{}'::jsonb,
  hash text not null,
  unique (source_id, ordinal)
);

create table public.preparation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  class_id uuid,
  status text not null default 'pending' check (status in ('pending', 'extracting', 'needs_clarification', 'drafting', 'needs_review', 'ready', 'failed', 'cancelled')),
  current_step integer not null default 0 check (current_step >= 0),
  lease_until timestamptz,
  input_hash text not null,
  partial_results jsonb not null default '{}'::jsonb,
  error_code text,
  foreign key (class_id, owner_id) references public.classes(id, teacher_id) on delete cascade
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  class_id uuid,
  title text not null,
  current_published_version uuid,
  archived_at timestamptz,
  foreign key (class_id, owner_id) references public.classes(id, teacher_id) on delete cascade
);

create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons on delete cascade,
  version integer not null check (version > 0),
  objectives_json jsonb not null check (jsonb_typeof(objectives_json) = 'array' and jsonb_array_length(objectives_json) > 0),
  reference_json jsonb not null default '[]'::jsonb check (jsonb_typeof(reference_json) = 'array'),
  provenance jsonb not null,
  initial_question text not null,
  review_status text not null default 'draft' check (review_status in ('draft', 'needs_review', 'approved', 'published')),
  reviewer_id uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lesson_id, version),
  unique (lesson_id, id),
  check (review_status <> 'published' or (reviewed_at is not null and jsonb_array_length(reference_json) > 0))
);
alter table public.lessons add constraint published_version_belongs_to_lesson
  foreign key (id, current_published_version) references public.lesson_versions(lesson_id, id) deferrable initially deferred;

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles on delete cascade,
  class_id uuid references public.classes on delete cascade,
  lesson_version_id uuid not null references public.lesson_versions on delete cascade,
  status text not null default 'ready' check (status in ('ready', 'awaiting_student', 'evaluating', 'supervisor_pending', 'errby_ready', 'needs_review', 'paused', 'ended_incomplete', 'completed')),
  last_sequence integer not null default 0 check (last_sequence >= 0),
  active_ms bigint not null default 0 check (active_ms >= 0),
  lease_until timestamptz,
  opened_at timestamptz not null default now(),
  ended_at timestamptz,
  visibility text not null check (visibility in ('private', 'class')),
  check ((visibility = 'private' and class_id is null) or (visibility = 'class' and class_id is not null))
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  sequence integer not null check (sequence >= 0),
  role text not null check (role in ('student', 'errby', 'supervisor')),
  text text not null check (char_length(text) > 0),
  turn_id uuid not null,
  created_at timestamptz not null default now(),
  source_refs_json jsonb not null default '[]'::jsonb,
  unique (session_id, sequence),
  unique (session_id, turn_id, role),
  unique (session_id, id)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  message_id uuid not null,
  objective_id text not null,
  verdict text not null check (verdict in ('correct', 'partial', 'incorrect', 'unverified', 'off_topic')),
  learner_evidence_span text not null,
  source_refs jsonb not null default '[]'::jsonb,
  assisted boolean not null,
  uncertainty_reason text,
  rubric_version text not null,
  model_id text not null,
  foreign key (session_id, message_id) references public.messages(session_id, id) on delete cascade,
  unique (message_id, objective_id)
);

create table public.objective_progress (
  session_id uuid not null references public.sessions on delete cascade,
  objective_id text not null,
  state text not null default 'untested' check (state in ('untested', 'developing', 'explained', 'unverified')),
  evidence_evaluation_ids uuid[] not null default '{}',
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (session_id, objective_id),
  check (state <> 'explained' or cardinality(evidence_evaluation_ids) > 0)
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  message_id uuid not null,
  trigger text not null check (trigger in ('correction', 'uncertainty', 'app_error')),
  correction text not null,
  resolved boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed')),
  reviewer_id uuid references public.profiles on delete set null,
  foreign key (session_id, message_id) references public.messages(session_id, id) on delete cascade
);

create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  actor_id uuid references public.profiles on delete set null,
  event_name text not null,
  sequence integer not null check (sequence >= 0),
  server_time timestamptz not null default now(),
  permitted_metadata jsonb not null default '{}'::jsonb,
  unique (session_id, sequence, event_name)
);

create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  request_key uuid not null unique,
  owner_scope uuid references public.profiles on delete set null,
  role text not null check (role in ('preparation', 'evaluation', 'errby')),
  reserved_cost numeric(12,6) not null check (reserved_cost >= 0),
  actual_tokens integer check (actual_tokens >= 0),
  actual_cost numeric(12,6) check (actual_cost >= 0),
  provider_status text not null check (provider_status in ('reserved', 'pending', 'succeeded', 'failed', 'released')),
  created_at timestamptz not null default now()
);

create table public.assessment_revisions (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations on delete cascade,
  reviewer_id uuid references public.profiles on delete set null,
  old_verdict text not null check (old_verdict in ('correct', 'partial', 'incorrect', 'unverified', 'off_topic')),
  new_verdict text not null check (new_verdict in ('correct', 'partial', 'incorrect', 'unverified', 'off_topic')),
  reason text not null check (char_length(reason) > 0),
  created_at timestamptz not null default now()
);

create function public.protect_published_version() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.review_status = 'published' then raise exception 'Published versions are immutable'; end if;
  return new;
end;
$$;
create trigger immutable_published_version before update on public.lesson_versions
  for each row execute function public.protect_published_version();

create function public.check_session_scope() returns trigger language plpgsql set search_path = '' as $$
declare lesson record;
begin
  if tg_op = 'UPDATE' and (new.learner_id <> old.learner_id or new.lesson_version_id <> old.lesson_version_id or new.class_id is distinct from old.class_id) then
    raise exception 'Session ownership and lesson version are immutable';
  end if;
  select l.owner_id, l.class_id, l.archived_at, v.review_status into lesson
    from public.lessons l join public.lesson_versions v on v.lesson_id = l.id where v.id = new.lesson_version_id;
  if not found or lesson.review_status <> 'published' or lesson.archived_at is not null then raise exception 'Lesson unavailable'; end if;
  if lesson.class_id is distinct from new.class_id then raise exception 'Cross-class lesson denied'; end if;
  if new.class_id is null then
    if lesson.owner_id <> new.learner_id then raise exception 'Private lesson denied'; end if;
  elsif not exists (select 1 from public.memberships m join public.classes c on c.id = m.class_id
    where m.class_id = new.class_id and m.student_id = new.learner_id and m.status = 'active' and c.active) then
    raise exception 'Active membership required';
  end if;
  return new;
end;
$$;
create trigger valid_session_scope before insert or update of learner_id, class_id, lesson_version_id
  on public.sessions for each row execute function public.check_session_scope();

create index on public.classes(teacher_id);
create index on public.memberships(student_id, status);
create index on public.source_documents(owner_id);
create index on public.lessons(class_id);
create index on public.lessons(owner_id);
create index on public.sessions(learner_id);
create index on public.sessions(class_id);
create index on public.preparation_jobs(owner_id);

-- Explicit baseline privileges; no anonymous access, no direct score/role writes.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','classes','memberships','source_documents','source_chunks','preparation_jobs','lessons','lesson_versions','sessions','messages','evaluations','objective_progress','interventions','learning_events','usage_ledger','assessment_revisions'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end;
$$;
grant select on public.profiles, public.memberships, public.source_documents, public.source_chunks,
  public.preparation_jobs, public.lessons, public.lesson_versions, public.sessions,
  public.messages, public.evaluations, public.objective_progress, public.interventions to authenticated;
grant select (id, teacher_id, title, grade_band, active) on public.classes to authenticated;

create policy own_profile on public.profiles for select to authenticated using (auth_user_id = (select auth.uid()));
create policy own_memberships on public.memberships for select to authenticated using (student_id = (select auth.uid()));
create policy own_class on public.classes for select to authenticated using (
  teacher_id = (select auth.uid()) or (active and exists (select 1 from public.memberships m where m.class_id = id and m.student_id = (select auth.uid()) and m.status = 'active')));
create policy own_sources on public.source_documents for select to authenticated using (owner_id = (select auth.uid()));
create policy own_chunks on public.source_chunks for select to authenticated using (exists (select 1 from public.source_documents d where d.id = source_id and d.owner_id = (select auth.uid())));
create policy own_jobs on public.preparation_jobs for select to authenticated using (owner_id = (select auth.uid()));
create policy visible_lessons on public.lessons for select to authenticated using (
  owner_id = (select auth.uid()) or (archived_at is null and current_published_version is not null and exists (
    select 1 from public.memberships m join public.classes c on c.id = m.class_id where m.class_id = lessons.class_id and m.student_id = (select auth.uid()) and m.status = 'active' and c.active)));
create policy visible_versions on public.lesson_versions for select to authenticated using (exists (
  select 1 from public.lessons l where l.id = lesson_id and (l.owner_id = (select auth.uid()) or (review_status = 'published' and l.archived_at is null))));
create policy own_sessions on public.sessions for select to authenticated using (
  learner_id = (select auth.uid()) and (class_id is null or exists (select 1 from public.memberships m where m.class_id = sessions.class_id and m.student_id = (select auth.uid()) and m.status = 'active')));
create policy own_messages on public.messages for select to authenticated using (exists (select 1 from public.sessions s where s.id = session_id));
create policy own_evaluations on public.evaluations for select to authenticated using (exists (select 1 from public.sessions s where s.id = session_id));
create policy own_progress on public.objective_progress for select to authenticated using (exists (select 1 from public.sessions s where s.id = session_id));
create policy own_interventions on public.interventions for select to authenticated using (exists (select 1 from public.sessions s where s.id = session_id));

revoke execute on function public.protect_published_version() from public;
revoke execute on function public.check_session_scope() from public;
