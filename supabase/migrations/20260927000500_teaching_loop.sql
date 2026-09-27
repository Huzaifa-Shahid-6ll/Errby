-- One fenced transaction commits a whole teaching turn; provider work happens outside it.
alter table public.sessions add column processing_token uuid;
alter table public.sessions add column processed_message_id uuid;
alter table public.messages add column misconception_id text;
alter table public.interventions add column objective_id text;
alter table public.interventions add column misconception_id text;

create function public.claim_learning_turn(p_learner uuid,p_session_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s record; token uuid;
begin
  select * into s from public.sessions where id=p_session_id for update;
  perform public.assert_learning_session_access(p_learner,p_session_id);
  if s.status <> 'evaluating' or s.lease_until > now() then return null; end if;
  token := gen_random_uuid();
  update public.sessions set processing_token=token,lease_until=now()+interval '180 seconds' where id=p_session_id;
  return jsonb_build_object('token',token,'lesson_version_id',s.lesson_version_id);
end; $$;

create function public.release_learning_turn(p_learner uuid,p_session_id uuid,p_token uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
  update public.sessions set processing_token=null,lease_until=null
    where id=p_session_id and learner_id=p_learner and processing_token=p_token;
end; $$;

create function public.finish_learning_turn(p_learner uuid,p_session_id uuid,p_token uuid,p_message_id uuid,
  p_assessments jsonb,p_rubric_version text,p_model_id text,p_reply jsonb)
returns text language plpgsql security invoker set search_path='' as $$
declare s record; state text; item jsonb; reply_id uuid; seq integer; correction text;
begin
  select * into s from public.sessions where id=p_session_id for update;
  perform public.assert_learning_session_access(p_learner,p_session_id);
  if s.processed_message_id = p_message_id then return s.status; end if;
  if s.status <> 'evaluating' or s.processing_token is distinct from p_token or s.lease_until <= now()
    then raise exception 'processing_lease_lost'; end if;
  -- Only independent evidence for the SAME objective resolves a correction.
  for item in select value from jsonb_array_elements(p_assessments) loop
    if item->>'verdict'='correct' and item->>'independent'='true' and item->>'assisted'='false' then
      update public.interventions set resolved=true where session_id=p_session_id
        and objective_id=item->>'objective_id' and trigger='correction' and not resolved;
    end if;
  end loop;
  -- Insert unresolved interventions before completion is calculated.
  for item in select value from jsonb_array_elements(p_assessments) loop
    if item->>'verdict' in ('incorrect','unverified') then
      correction := case when p_reply->>'kind'='reply' then p_reply->>'text'
        else 'This explanation needs review against its sources. It has not completed the lesson.' end;
      insert into public.interventions(session_id,message_id,trigger,correction,objective_id,misconception_id)
        values(p_session_id,p_message_id,case when item->>'verdict'='incorrect' then 'correction' else 'uncertainty' end,
          correction,item->>'objective_id',p_reply->>'unresolved_misconception_id');
    end if;
  end loop;
  if p_reply->>'kind'='needs_review' and not exists (select 1 from public.interventions where session_id=p_session_id and message_id=p_message_id and not resolved) then
    insert into public.interventions(session_id,message_id,trigger,correction)
      values(p_session_id,p_message_id,'app_error','The next teaching step needs source review.');
  end if;
  state := public.record_objective_evidence(p_session_id,p_message_id,p_assessments,p_rubric_version,p_model_id);
  seq := s.last_sequence+1;
  if state='completed' then
    insert into public.messages(session_id,sequence,role,text,turn_id)
      values(p_session_id,seq,'errby','You have independently explained every required objective. Your saved recap is ready.',p_message_id);
  elsif p_reply->>'kind'='needs_review' then
    state := 'needs_review';
    insert into public.messages(session_id,sequence,role,text,turn_id)
      values(p_session_id,seq,'supervisor','This explanation needs review against its sources. Your answer is saved; the lesson is not complete.',p_message_id);
  else
    if p_reply->>'role' not in ('errby','supervisor') or nullif(p_reply->>'text','') is null then raise exception 'invalid_reply'; end if;
    state := 'awaiting_student';
    insert into public.messages(session_id,sequence,role,text,turn_id,source_refs_json,misconception_id)
      values(p_session_id,seq,p_reply->>'role',p_reply->>'text',p_message_id,
        coalesce(p_reply->'reference_ids','[]'::jsonb),p_reply->>'misconception_id') returning id into reply_id;
  end if;
  update public.sessions set status=state,last_sequence=seq,processed_message_id=p_message_id,
    processing_token=null,lease_until=null where id=p_session_id;
  return state;
end; $$;
revoke execute on function public.claim_learning_turn(uuid,uuid),public.release_learning_turn(uuid,uuid,uuid),
  public.finish_learning_turn(uuid,uuid,uuid,uuid,jsonb,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_learning_turn(uuid,uuid),public.release_learning_turn(uuid,uuid,uuid),
  public.finish_learning_turn(uuid,uuid,uuid,uuid,jsonb,text,text,jsonb) to service_role;
create or replace function public.open_learning_session(p_learner uuid, p_lesson_version_id uuid)
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
  if not found or (lesson.review_status <> 'published' and not (lesson.review_status = 'private_ready' and lesson.class_id is null and lesson.owner_id = p_learner)) or lesson.archived_at is not null
    or (lesson.review_status = 'published' and lesson.current_published_version is distinct from p_lesson_version_id) then
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


create or replace function public.check_session_scope() returns trigger language plpgsql set search_path = '' as $$
declare lesson record;
begin
  if tg_op = 'UPDATE' and (new.learner_id <> old.learner_id or new.lesson_version_id <> old.lesson_version_id or new.class_id is distinct from old.class_id) then
    raise exception 'Session ownership and lesson version are immutable';
  end if;
  select l.owner_id, l.class_id, l.archived_at, v.review_status into lesson
    from public.lessons l join public.lesson_versions v on v.lesson_id = l.id where v.id = new.lesson_version_id;
  if not found or (lesson.review_status <> 'published' and not (lesson.review_status = 'private_ready' and lesson.class_id is null and lesson.owner_id = new.learner_id)) or lesson.archived_at is not null then raise exception 'Lesson unavailable'; end if;
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

