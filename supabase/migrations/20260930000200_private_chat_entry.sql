-- Reuse private sessions; a retried first message must not open duplicate chats.
create function public.open_private_chat(p_learner uuid,p_version uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare saved uuid; opened jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_learner::text || p_version::text, 7));
  if not exists(select 1 from public.lesson_versions v join public.lessons l on l.id=v.lesson_id
    where v.id=p_version and l.owner_id=p_learner and l.class_id is null and l.archived_at is null
      and v.review_status='private_ready') then raise exception 'private_lesson_denied'; end if;
  select id into saved from public.sessions where learner_id=p_learner and lesson_version_id=p_version
    and visibility='private' order by opened_at limit 1;
  if saved is not null then
    perform public.assert_learning_session_access(p_learner,saved);
    return saved;
  end if;
  opened:=public.open_learning_session(p_learner,p_version);
  return (opened->'session'->>'id')::uuid;
end; $$;
revoke all on function public.open_private_chat(uuid,uuid) from public,anon,authenticated;
grant execute on function public.open_private_chat(uuid,uuid) to service_role;
