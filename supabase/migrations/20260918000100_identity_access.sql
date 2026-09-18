-- Roles are operator-provisioned records, never copied from user_metadata.
-- Existing profiles stay unchanged; unknown Auth accounts have no app access.
create function public.check_identity_roles() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'profiles' then
    if new.role <> old.role then raise exception 'Profile roles are immutable'; end if;
  elsif tg_table_name = 'classes' then
    if not exists (select 1 from public.profiles where auth_user_id = new.teacher_id and role = 'teacher') then
      raise exception 'Teacher profile required';
    end if;
  elsif tg_table_name = 'memberships' then
    if not exists (select 1 from public.profiles where auth_user_id = new.student_id and role = 'learner') then
      raise exception 'Learner profile required';
    end if;
  elsif tg_table_name = 'sessions' then
    if not exists (select 1 from public.profiles where auth_user_id = new.learner_id and role = 'learner') then
      raise exception 'Learner profile required';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.check_identity_roles() from public;
create trigger immutable_profile_role before update of role on public.profiles for each row execute function public.check_identity_roles();
create trigger class_teacher_role before insert or update of teacher_id on public.classes for each row execute function public.check_identity_roles();
create trigger membership_learner_role before insert or update of student_id on public.memberships for each row execute function public.check_identity_roles();
create trigger session_learner_role before insert or update of learner_id on public.sessions for each row execute function public.check_identity_roles();

drop policy own_sessions on public.sessions;
create policy own_sessions on public.sessions for select to authenticated using (
  learner_id = (select auth.uid()) and (class_id is null or exists (
    select 1 from public.memberships m join public.classes c on c.id = m.class_id
    where m.class_id = sessions.class_id and m.student_id = (select auth.uid()) and m.status = 'active' and c.active)));

-- Durable, cross-instance login throttling. Only the server may consume attempts.
-- No emails/IPs/passwords retained. Rows expire after the 15-minute window.
create table public.sign_in_attempts (
  key text not null,
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (key, window_start)
);
alter table public.sign_in_attempts enable row level security;
revoke all on public.sign_in_attempts from public, anon, authenticated;
grant all on public.sign_in_attempts to service_role;

create function public.reserve_sign_in_attempt(identifier_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  window_time timestamptz := date_bin(interval '15 minutes', now(), timestamptz '2026-01-01');
  count_now integer;
begin
  if identifier_hash is null or identifier_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid identifier hash'; end if;
  delete from public.sign_in_attempts where window_start < window_time;
  -- ponytail: 100 logins/15m global pilot ceiling; replace with a trusted-IP
  -- distributed limiter when legitimate traffic outgrows this small test pilot.
  -- Global bound prevents arbitrary identifiers growing this table without limit.
  insert into public.sign_in_attempts values ('global', window_time, 1)
    on conflict (key, window_start) do update set attempts = least(public.sign_in_attempts.attempts + 1, 101)
    returning attempts into count_now;
  if count_now > 100 then return false; end if;
  insert into public.sign_in_attempts values (identifier_hash, window_time, 1)
    on conflict (key, window_start) do update set attempts = least(public.sign_in_attempts.attempts + 1, 6)
    returning attempts into count_now;
  return count_now <= 5;
end;
$$;
revoke all on function public.reserve_sign_in_attempt(text) from public, anon, authenticated;
grant execute on function public.reserve_sign_in_attempt(text) to service_role;
