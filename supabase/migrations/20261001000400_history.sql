-- Private history is read with the caller's RLS token, never the service role.
create function public.search_private_history(p_owner uuid, p_query text default '', p_offset integer default 0)
returns table(id uuid, title text, opened_at timestamptz)
language plpgsql stable security invoker set search_path='' as $$
begin
  if p_owner is null or p_owner is distinct from public.current_app_user_id() then
    raise exception 'history_access_denied';
  end if;
  if p_query is null or char_length(p_query) > 120 or p_offset is null or p_offset < 0 then
    raise exception 'invalid_history_query';
  end if;
  -- ponytail: substring search scans this owner's messages; add a search index if measured history volume needs it.
  return query
    select s.id, l.title, s.opened_at
    from public.sessions s
    join public.lesson_versions v on v.id=s.lesson_version_id
    join public.lessons l on l.id=v.lesson_id
    where s.learner_id=p_owner and s.visibility='private'
      and (p_query='' or strpos(lower(l.title),lower(p_query)) > 0
        or exists(select 1 from public.messages m where m.session_id=s.id and strpos(lower(m.text),lower(p_query)) > 0))
    order by s.opened_at desc,s.id desc
    limit 21 offset p_offset;
end; $$;
revoke all on function public.search_private_history(uuid,text,integer) from public,anon;
grant execute on function public.search_private_history(uuid,text,integer) to authenticated;
create index sessions_private_history on public.sessions(learner_id,opened_at desc,id desc) where visibility='private';
