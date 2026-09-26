-- T07 learning sessions. The opening message is the published version's own
-- initial_question bound server-side; no model or client text enters here.
-- Only the server (service_role) may execute; Auth/RLS reads stay scoped.
create function public.open_learning_session(p_learner uuid, p_lesson_version_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  lesson record;
  new_session record;
  opening record;
begin
  if not exists (select 1 from public.profiles where auth_user_id = p_learner and role = 'learner') then
    raise exception 'session_learner_required';
  end if;
  -- Lock the lesson row so concurrent archive/publication changes serialize
  -- with session creation. Visibility/class come from the lesson, never the client.
  select l.owner_id, l.class_id, l.archived_at, l.current_published_version, v.review_status, v.initial_question
    into lesson
    from public.lessons l join public.lesson_versions v on v.lesson_id = l.id
    where v.id = p_lesson_version_id
    for update of l;
  if not found or lesson.review_status <> 'published' or lesson.archived_at is not null
    or lesson.current_published_version is distinct from p_lesson_version_id then
    raise exception 'lesson_unavailable';
  end if;
  if lesson.class_id is null then
    if lesson.owner_id is distinct from p_learner then raise exception 'private_lesson_denied'; end if;
  elsif not exists (
    select 1 from public.memberships m join public.classes c on c.id = m.class_id
    where m.class_id = lesson.class_id and m.student_id = p_learner and m.status = 'active' and c.active
  ) then
    raise exception 'membership_required';
  end if;
  -- The BEFORE INSERT triggers re-validate learner role and session scope.
  insert into public.sessions(learner_id, class_id, lesson_version_id, status, last_sequence, visibility)
    values (p_learner, lesson.class_id, p_lesson_version_id, 'awaiting_student', 0,
            case when lesson.class_id is null then 'private' else 'class' end)
    returning * into new_session;
  insert into public.messages(session_id, sequence, role, text, turn_id)
    values (new_session.id, 0, 'errby', lesson.initial_question, gen_random_uuid())
    returning id, sequence, role, text, turn_id, created_at into opening;
  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', new_session.id, 'status', new_session.status, 'visibility', new_session.visibility,
      'class_id', new_session.class_id, 'lesson_version_id', new_session.lesson_version_id,
      'last_sequence', new_session.last_sequence, 'opened_at', new_session.opened_at),
    'message', jsonb_build_object(
      'id', opening.id, 'sequence', opening.sequence, 'role', opening.role,
      'text', opening.text, 'turn_id', opening.turn_id, 'created_at', opening.created_at));
end;
$$;

create function public.record_student_turn(p_learner uuid, p_session_id uuid, p_turn_id uuid, p_text text, p_expected_sequence integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  session_row record;
  replay record;
  turn record;
  saved record;
begin
  select * into session_row from public.sessions where id = p_session_id for update;
  if not found or session_row.learner_id <> p_learner then raise exception 'session_forbidden'; end if;
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

revoke execute on function public.open_learning_session(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.record_student_turn(uuid,uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.open_learning_session(uuid,uuid),
  public.record_student_turn(uuid,uuid,uuid,text,integer) to service_role;

-- T07 scope repair: published lesson content was readable by every
-- authenticated account. Restrict published versions to the lesson owner or
-- active members of the lesson's class, and only the current published version.
drop policy visible_versions on public.lesson_versions;
create policy visible_versions on public.lesson_versions for select to authenticated using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_versions.lesson_id
      and (
        l.owner_id = (select auth.uid())
        or (
          lesson_versions.review_status = 'published'
          and l.archived_at is null
          and l.current_published_version = lesson_versions.id
          and exists (
            select 1 from public.memberships m join public.classes c on c.id = m.class_id
            where m.class_id = l.class_id and m.student_id = (select auth.uid())
              and m.status = 'active' and c.active
          )
        )
      )
  )
);
