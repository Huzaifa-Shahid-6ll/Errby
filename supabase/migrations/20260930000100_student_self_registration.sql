-- Server-only bootstrap after verified Clerk/Supabase authentication and a
-- current provider-user check. No selectable role, legacy UUID or class.
begin;
create function public.ensure_student_profile(p_clerk_user_id text, p_issuer text) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  linked public.clerk_identities;
  app_id uuid;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$'
    or p_issuer is null or p_issuer !~ '^https://[^/]+$'
    then raise exception 'invalid_identity'; end if;

  -- Share the operator provisioner's lock so first visits cannot duplicate users.
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  select * into linked from public.clerk_identities where clerk_user_id = p_clerk_user_id;
  if found then
    if linked.issuer <> p_issuer or linked.deletion_requested_at is not null
      then raise exception 'identity_unavailable'; end if;
    return linked.user_id;
  end if;

  insert into public.profiles(role, alias, setup_mode)
    values ('learner', 'Student', 'independent')
    returning auth_user_id into app_id;
  insert into public.clerk_identities(user_id, clerk_user_id, issuer)
    values (app_id, p_clerk_user_id, p_issuer);
  return app_id;
end;
$$;
revoke all on function public.ensure_student_profile(text,text) from public, anon, authenticated;
grant execute on function public.ensure_student_profile(text,text) to service_role;
commit;
