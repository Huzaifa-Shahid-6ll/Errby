-- Class operations are transactional and callable only by the server.
create unique index classes_join_code_hash_key on public.classes(join_code_hash);
alter table public.classes add constraint classes_grade_band_check check (grade_band in ('primary', 'middle_school', 'high_school'));

create table public.class_code_attempts (
  actor_id uuid not null,
  window_start timestamptz not null,
  attempts integer not null,
  primary key (actor_id, window_start)
);
alter table public.class_code_attempts enable row level security;
revoke all on public.class_code_attempts from public, anon, authenticated;
grant all on public.class_code_attempts to service_role;

create function public.create_class(p_teacher uuid, p_title text, p_grade text, p_code_hash text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid;
begin
  if not exists (select 1 from public.profiles where auth_user_id = p_teacher and role = 'teacher') then raise exception 'teacher_required'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 160 or p_grade not in ('primary', 'middle_school', 'high_school') or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_class'; end if;
  insert into public.classes(teacher_id,title,grade_band,join_code_hash) values (p_teacher,btrim(p_title),p_grade,p_code_hash) returning id into result;
  return result;
end; $$;

create function public.rotate_class_code(p_teacher uuid, p_class uuid, p_code_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_code'; end if;
  update public.classes set join_code_hash = p_code_hash, join_code_rotated_at = now()
  where id = p_class and teacher_id = p_teacher and active
    and exists (select 1 from public.profiles where auth_user_id = p_teacher and role = 'teacher');
  return found;
end; $$;

create function public.join_class(p_learner uuid, p_code_hash text, p_confirm boolean)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  bucket timestamptz := date_bin(interval '15 minutes', now(), timestamptz '2026-01-01');
  count_now integer;
  target public.classes%rowtype;
  teacher_alias text;
  learner_alias text;
begin
  if not exists (select 1 from public.profiles where auth_user_id = p_learner and role = 'learner') then raise exception 'learner_required'; end if;
  if p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_code'; end if;
  delete from public.class_code_attempts where window_start < bucket;
  -- ponytail: 1000 global attempts/15m caps storage and guessing in the pilot; move to a trusted distributed limiter at larger traffic.
  insert into public.class_code_attempts values ('00000000-0000-0000-0000-000000000000',bucket,1)
    on conflict (actor_id,window_start) do update set attempts = least(public.class_code_attempts.attempts + 1,1001)
    returning attempts into count_now;
  if count_now > 1000 then return jsonb_build_object('error','rate_limited'); end if;
  insert into public.class_code_attempts values (p_learner,bucket,1)
    on conflict (actor_id,window_start) do update set attempts = least(public.class_code_attempts.attempts + 1,11)
    returning attempts into count_now;
  if count_now > 10 then return jsonb_build_object('error','rate_limited'); end if;
  select * into target from public.classes where join_code_hash = p_code_hash and active for update;
  if not found then return jsonb_build_object('error','invalid_code'); end if;
  select alias into teacher_alias from public.profiles where auth_user_id = target.teacher_id;
  if p_confirm then
    select alias into learner_alias from public.profiles where auth_user_id = p_learner;
    insert into public.memberships(class_id,student_id,alias_in_class,status)
      values(target.id,p_learner,learner_alias,'active')
      on conflict (class_id,student_id) do update set status = 'active';
  end if;
  return jsonb_build_object('id',target.id,'title',target.title,'grade_band',target.grade_band,'teacher',teacher_alias,'joined',p_confirm);
end; $$;

revoke all on function public.create_class(uuid,text,text,text), public.rotate_class_code(uuid,uuid,text), public.join_class(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.create_class(uuid,text,text,text), public.rotate_class_code(uuid,uuid,text), public.join_class(uuid,text,boolean) to service_role;
