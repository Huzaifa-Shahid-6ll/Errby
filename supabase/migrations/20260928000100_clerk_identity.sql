-- Apply only during the documented Clerk cutover. Old Supabase tokens cease
-- granting app access immediately. All owned UUIDs and records are preserved.
begin;
alter table public.profiles drop constraint profiles_auth_user_id_fkey;
alter table public.profiles alter column auth_user_id set default gen_random_uuid();

create table public.clerk_identities (
  user_id uuid primary key references public.profiles(auth_user_id) on delete cascade,
  clerk_user_id text not null unique check (clerk_user_id ~ '^user_[A-Za-z0-9]+$'),
  issuer text not null check (issuer ~ '^https://[^/]+$'),
  deletion_requested_at timestamptz
);
alter table public.clerk_identities enable row level security;
revoke all on public.clerk_identities from public, anon, authenticated;
grant all on public.clerk_identities to service_role;

create function public.current_app_user_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select user_id from public.clerk_identities
  where clerk_user_id = (select auth.jwt()->>'sub')
    and issuer = (select auth.jwt()->>'iss')
    and (select auth.jwt()->>'role') = 'authenticated'
    and (select auth.jwt()->>'sts') is distinct from 'pending'
    and deletion_requested_at is null
$$;
revoke all on function public.current_app_user_id() from public, anon;
grant execute on function public.current_app_user_id() to authenticated, service_role;

-- Alter only the identity expression in existing SELECT policies. Preserve
-- every class, membership, publication, archive and ownership condition.
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname, qual from pg_policies
    where schemaname = 'public' and qual like '%auth.uid()%'
  loop
    execute format('alter policy %I on %I.%I using (%s)', p.policyname,
      p.schemaname, p.tablename, replace(p.qual, 'auth.uid()', 'public.current_app_user_id()'));
  end loop;
end;
$$;

-- Operator-only approval/linking, with one atomic transaction per identity.
-- No user metadata or email address can grant roles or merge existing users.
create function public.provision_clerk_identity(
  p_clerk_user_id text, p_issuer text, p_role text, p_alias text,
  p_grade text default null, p_existing_user_id uuid default null,
  p_class_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare app_id uuid; linked public.clerk_identities; profile public.profiles;
begin
  if p_role not in ('teacher','learner') or p_role is null then raise exception 'invalid_role'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  select * into linked from public.clerk_identities where clerk_user_id = p_clerk_user_id;
  if found then
    select * into profile from public.profiles where auth_user_id = linked.user_id;
    if linked.issuer <> p_issuer or linked.deletion_requested_at is not null
      or (p_existing_user_id is not null and linked.user_id <> p_existing_user_id)
      or profile.role <> p_role then raise exception 'identity_conflict'; end if;
    app_id := linked.user_id;
  else
    if p_existing_user_id is not null then
      select * into profile from public.profiles where auth_user_id = p_existing_user_id for update;
      if not found or profile.role <> p_role then raise exception 'profile_mismatch'; end if;
      app_id := profile.auth_user_id;
    else
      insert into public.profiles(role,alias,grade_band,setup_mode)
        values(p_role,p_alias,p_grade,case when p_role='teacher' then 'independent' else 'assisted' end)
        returning auth_user_id into app_id;
    end if;
    insert into public.clerk_identities(user_id,clerk_user_id,issuer)
      values(app_id,p_clerk_user_id,p_issuer);
  end if;
  if p_class_id is not null then
    if p_role <> 'learner' or not exists(select 1 from public.classes where id=p_class_id and active)
      then raise exception 'active_class_required'; end if;
    insert into public.memberships(class_id,student_id,alias_in_class)
      select p_class_id,app_id,alias from public.profiles where auth_user_id=app_id
      on conflict(class_id,student_id) do nothing;
  end if;
  return app_id;
end;
$$;
revoke all on function public.provision_clerk_identity(text,text,text,text,text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.provision_clerk_identity(text,text,text,text,text,uuid,uuid) to service_role;

-- A durable denial precedes provider deletion. Retries never reactivate it.
create function public.begin_clerk_account_deletion(p_clerk_user_id text,p_issuer text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare app_id uuid;
begin
  select user_id into app_id from public.clerk_identities
    where clerk_user_id=p_clerk_user_id and issuer=p_issuer for update;
  if not found then return null; end if;
  perform 1 from public.profiles where auth_user_id=app_id for update;
  if exists(select 1 from public.classes where teacher_id=app_id) then raise exception 'classes_remain'; end if;
  update public.clerk_identities set deletion_requested_at=coalesce(deletion_requested_at,now()) where user_id=app_id;
  return app_id;
end;
$$;
revoke all on function public.begin_clerk_account_deletion(text,text) from public, anon, authenticated;
grant execute on function public.begin_clerk_account_deletion(text,text) to service_role;
commit;
