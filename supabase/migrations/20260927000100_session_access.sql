-- Service-role session reads/replays must respect current learner access.
create function public.assert_learning_session_access(p_learner uuid, p_session_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.sessions s
    join public.profiles p on p.auth_user_id = s.learner_id and p.role = 'learner'
    join public.lesson_versions v on v.id = s.lesson_version_id
    join public.lessons l on l.id = v.lesson_id
    where s.id = p_session_id and s.learner_id = p_learner and l.archived_at is null
      and l.class_id is not distinct from s.class_id
      and ((s.class_id is null and l.owner_id = p_learner) or exists (
        select 1 from public.memberships m join public.classes c on c.id = m.class_id
        where m.class_id = s.class_id and m.student_id = p_learner and m.status = 'active' and c.active
      ))
  ) then raise exception 'session_not_found'; end if;
end;
$$;
revoke execute on function public.assert_learning_session_access(uuid,uuid) from public, anon, authenticated;
grant execute on function public.assert_learning_session_access(uuid,uuid) to service_role;

-- Child transcript/evidence policies already use this session policy.
drop policy own_sessions on public.sessions;
create policy own_sessions on public.sessions for select to authenticated using (
  learner_id = (select auth.uid())
  and exists (
    select 1 from public.lessons l join public.lesson_versions v on v.lesson_id = l.id
    where v.id = sessions.lesson_version_id and l.archived_at is null
      and l.class_id is not distinct from sessions.class_id
      and (l.class_id is not null or l.owner_id = (select auth.uid()))
  )
  and (class_id is null or exists (
    select 1 from public.memberships m join public.classes c on c.id = m.class_id
    where m.class_id = sessions.class_id and m.student_id = (select auth.uid()) and m.status = 'active' and c.active
  ))
);

create or replace function public.record_student_turn(p_learner uuid, p_session_id uuid, p_turn_id uuid, p_text text, p_expected_sequence integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  session_row record;
  replay record;
  turn record;
  saved record;
begin
  select * into session_row from public.sessions where id = p_session_id for update;
  if not found or session_row.learner_id <> p_learner then raise exception 'session_forbidden'; end if;
  perform public.assert_learning_session_access(p_learner, p_session_id);
  -- Idempotent replay wins before any state checks: a retried request with the
  -- same key and identical text returns the stored message without new writes.
  select * into replay from public.messages
    where session_id = p_session_id and turn_id = p_turn_id and role = 'student';
  if found then
    if replay.text is distinct from p_text then raise exception 'turn_conflict'; end if;
    saved := replay;
  else
    if p_text is null or char_length(p_text) not between 1 and 2000 then raise exception 'invalid_turn'; end if;
    if session_row.last_sequence <> p_expected_sequence then raise exception 'sequence_conflict'; end if;
    if session_row.status <> 'awaiting_student' then raise exception 'session_not_awaiting'; end if;
    insert into public.messages(session_id, sequence, role, text, turn_id)
      values (p_session_id, session_row.last_sequence + 1, 'student', p_text, p_turn_id)
      returning id, sequence, role, text, turn_id, created_at into turn;
    update public.sessions set last_sequence = turn.sequence, status = 'evaluating' where id = p_session_id;
    session_row.last_sequence := turn.sequence;
    session_row.status := 'evaluating';
    saved := turn;
  end if;
  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', session_row.id, 'status', session_row.status, 'visibility', session_row.visibility,
      'class_id', session_row.class_id, 'lesson_version_id', session_row.lesson_version_id,
      'last_sequence', session_row.last_sequence, 'opened_at', session_row.opened_at),
    'message', jsonb_build_object(
      'id', saved.id, 'sequence', saved.sequence, 'role', saved.role,
      'text', saved.text, 'turn_id', saved.turn_id, 'created_at', saved.created_at));
end;
$$;

create or replace function public.set_learning_session_paused(p_learner uuid, p_session_id uuid, p_pause boolean)
returns text language plpgsql security invoker set search_path = '' as $$
declare s record;
begin
  select * into s from public.sessions where id = p_session_id for update;
  if not found or s.learner_id <> p_learner then raise exception 'session_forbidden'; end if;
  perform public.assert_learning_session_access(p_learner, p_session_id);
  if p_pause then
    if s.status = 'paused' then return 'paused'; end if;
    if s.status in ('completed','ended_incomplete') then raise exception 'session_not_pausable'; end if;
    update public.sessions set paused_from = s.status, status = 'paused' where id = p_session_id;
    return 'paused';
  end if;
  if s.status <> 'paused' then raise exception 'session_not_paused'; end if;
  update public.sessions set status = paused_from, paused_from = null where id = p_session_id;
  return s.paused_from;
end;
$$;
