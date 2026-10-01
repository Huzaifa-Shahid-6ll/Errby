-- Accepted, bounded app descriptors only. No generated executable content.
alter table public.messages add column visual_json jsonb;
alter table public.messages add column visual_context_json jsonb;
alter table public.messages add column visual_request boolean not null default false;
alter table public.messages add column visual_assistance boolean not null default false;

create function public.valid_chat_visual(v jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
begin
  if v is null or jsonb_typeof(v) <> 'object' then return false; end if;
  return coalesce(
    (select count(*)=9 from jsonb_object_keys(v))
    and v->>'version'='1' and v->>'kind'='linear_graph'
    and (v->>'id')::uuid is not null
    and jsonb_typeof(v->'revision')='number' and (v->>'revision')::numeric between 0 and 1000000
    and trunc((v->>'revision')::numeric)=(v->>'revision')::numeric
    and jsonb_typeof(v->'title')='string' and char_length(v->>'title') between 1 and 100
    and jsonb_typeof(v->'caption')='string' and char_length(v->>'caption') between 1 and 240
    and jsonb_typeof(v->'slope')='number' and (v->>'slope')::numeric between -5 and 5
    and jsonb_typeof(v->'intercept')='number' and (v->>'intercept')::numeric between -10 and 10
    and (v->'comparison'='null'::jsonb or (
      jsonb_typeof(v->'comparison')='object'
      and (select count(*)=2 from jsonb_object_keys(v->'comparison'))
      and jsonb_typeof(v->'comparison'->'slope')='number'
      and (v->'comparison'->>'slope')::numeric between -5 and 5
      and jsonb_typeof(v->'comparison'->'intercept')='number'
      and (v->'comparison'->>'intercept')::numeric between -10 and 10
    )), false);
exception when others then return false;
end; $$;
alter table public.messages add constraint bounded_visual check (visual_json is null or public.valid_chat_visual(visual_json));
alter table public.messages add constraint bounded_visual_context check (visual_context_json is null or public.valid_chat_visual(visual_context_json));
create unique index one_chat_visual_surface on public.messages(session_id,(visual_json->>'id')) where visual_json is not null;

-- Opening-chat assistance must be attached before a new session is visible.
create function public.open_private_chat_with_visual(p_learner uuid,p_version uuid,p_visual jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare opened_session_id uuid; s record; initial_context jsonb;
begin
  if not public.valid_chat_visual(p_visual) then raise exception 'invalid_visual'; end if;
  opened_session_id := public.open_private_chat(p_learner,p_version);
  select * into s from public.sessions where id=opened_session_id for update;
  perform public.assert_learning_session_access(p_learner,opened_session_id);
  select visual_context_json into initial_context from public.messages where session_id=s.id and sequence=0;
  if initial_context is not distinct from p_visual then return s.id; end if;
  if s.last_sequence <> 0 or initial_context is not null then raise exception 'visual_conflict'; end if;
  update public.messages set visual_assistance=true,visual_context_json=p_visual where session_id=s.id and sequence=0;
  return s.id;
end; $$;

create function public.save_chat_visual(p_learner uuid,p_session_id uuid,p_message_id uuid,p_visual jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s record; m record; accepted jsonb;
begin
  select * into s from public.sessions where id=p_session_id for update;
  perform public.assert_learning_session_access(p_learner,p_session_id);
  if s.status <> 'awaiting_student' then raise exception 'session_not_awaiting'; end if;
  if not public.valid_chat_visual(p_visual) then raise exception 'invalid_visual'; end if;
  select * into m from public.messages where id=p_message_id and session_id=p_session_id and visual_json is not null;
  if not found or m.visual_json->>'id' is distinct from p_visual->>'id' then raise exception 'visual_not_found'; end if;
  if m.visual_json->'revision' is distinct from p_visual->'revision' then raise exception 'visual_conflict'; end if;
  -- Controls can alter two numeric values, never provenance or generated text.
  if m.visual_json - 'slope' - 'intercept' is distinct from p_visual - 'slope' - 'intercept'
    then raise exception 'invalid_visual'; end if;
  accepted := p_visual;
  if p_visual is distinct from m.visual_json then
    if (p_visual->>'revision')::integer >= 1000000 then raise exception 'visual_conflict'; end if;
    accepted := jsonb_set(p_visual,'{revision}',to_jsonb((p_visual->>'revision')::integer+1));
    update public.messages set visual_json=accepted where id=m.id;
  end if;
  update public.messages set visual_assistance=true,visual_context_json=accepted
    where session_id=p_session_id and sequence=s.last_sequence;
  return accepted;
end; $$;

create function public.record_student_visual_turn(p_learner uuid,p_session_id uuid,p_turn_id uuid,p_text text,
  p_expected_sequence integer,p_visual_request boolean,p_current_visual jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare replay record; owner_message uuid; result jsonb; session_owner uuid;
begin
  p_current_visual := nullif(p_current_visual,'null'::jsonb);
  select learner_id into session_owner from public.sessions where id=p_session_id for update;
  if not found or session_owner <> p_learner then raise exception 'session_forbidden'; end if;
  perform public.assert_learning_session_access(p_learner,p_session_id);
  select * into replay from public.messages where session_id=p_session_id and turn_id=p_turn_id and role='student';
  if found then
    if replay.visual_request is distinct from p_visual_request or replay.visual_context_json is distinct from p_current_visual
      then raise exception 'turn_conflict'; end if;
    return public.record_student_turn(p_learner,p_session_id,p_turn_id,p_text,p_expected_sequence);
  end if;
  if p_current_visual is not null then
    select id into owner_message from public.messages where session_id=p_session_id and visual_json->>'id'=p_current_visual->>'id';
    if not found then raise exception 'visual_not_found'; end if;
    perform public.save_chat_visual(p_learner,p_session_id,owner_message,p_current_visual);
  end if;
  result := public.record_student_turn(p_learner,p_session_id,p_turn_id,p_text,p_expected_sequence);
  update public.messages set visual_request=p_visual_request,visual_context_json=p_current_visual
    where id=(result->'message'->>'id')::uuid;
  return result;
end; $$;

-- Keep the existing teaching transaction intact and extend it atomically.
alter function public.finish_learning_turn(uuid,uuid,uuid,uuid,jsonb,text,text,jsonb) rename to finish_learning_turn_without_visual;
create function public.finish_learning_turn(p_learner uuid,p_session_id uuid,p_token uuid,p_message_id uuid,
  p_assessments jsonb,p_rubric_version text,p_model_id text,p_reply jsonb)
returns text language plpgsql security invoker set search_path='' as $$
declare s record; answer record; old_visual jsonb; owner_message uuid; state text; v jsonb;
begin
  select * into s from public.sessions where id=p_session_id for update;
  perform public.assert_learning_session_access(p_learner,p_session_id);
  if s.processed_message_id=p_message_id then return s.status; end if;
  select * into answer from public.messages where id=p_message_id and session_id=p_session_id and role='student';
  if not found or answer.sequence <> s.last_sequence then raise exception 'invalid_turn'; end if;
  if answer.visual_request then
    p_assessments := '[]'::jsonb;
  elsif answer.visual_context_json is not null or exists (
    select 1 from public.messages where session_id=p_session_id and sequence=answer.sequence-1 and visual_assistance
  ) then
    -- ponytail: immediate answers using a graph are conservatively assisted;
    -- later fresh examples without an attached visual can demonstrate independence.
    select coalesce(jsonb_agg(value || '{"independent":false,"assisted":true}'::jsonb),'[]'::jsonb)
      into p_assessments from jsonb_array_elements(p_assessments);
  end if;
  v := nullif(p_reply->'visual','null'::jsonb);
  if v is not null then
    if not public.valid_chat_visual(v) then raise exception 'invalid_visual'; end if;
    select id,visual_json into owner_message,old_visual from public.messages where session_id=p_session_id and visual_json->>'id'=v->>'id';
    if found then
      if (v->>'revision')::integer <> (old_visual->>'revision')::integer+1 then raise exception 'visual_conflict'; end if;
    elsif v->>'revision' <> '0' then raise exception 'visual_conflict'; end if;
  end if;
  if answer.visual_request then
    if s.status <> 'evaluating' or s.processing_token is distinct from p_token or s.lease_until <= now()
      then raise exception 'processing_lease_lost'; end if;
    if p_reply->>'kind' <> 'reply' or p_reply->>'role' <> 'errby' or nullif(p_reply->>'text','') is null
      then raise exception 'invalid_reply'; end if;
    -- Exploring a graph is assistance, not a submitted explanation. Preserve all
    -- objective evidence and unresolved interventions without invoking grading.
    insert into public.messages(session_id,sequence,role,text,turn_id,visual_assistance)
      values(p_session_id,s.last_sequence+1,'errby',p_reply->>'text',p_message_id,true);
    state := 'awaiting_student';
    update public.sessions set status=state,last_sequence=s.last_sequence+1,processed_message_id=p_message_id,
      processing_token=null,lease_until=null where id=p_session_id;
  else
    state := public.finish_learning_turn_without_visual(p_learner,p_session_id,p_token,p_message_id,p_assessments,p_rubric_version,p_model_id,p_reply);
  end if;
  if v is not null and state='awaiting_student' then
    if owner_message is not null then
      update public.messages set visual_json=v where id=owner_message;
    else
      update public.messages set visual_json=v where session_id=p_session_id and sequence=s.last_sequence+1;
    end if;
    update public.messages set visual_assistance=true,visual_context_json=v where session_id=p_session_id and sequence=s.last_sequence+1;
  end if;
  return state;
end; $$;

revoke execute on function public.save_chat_visual(uuid,uuid,uuid,jsonb),
  public.open_private_chat_with_visual(uuid,uuid,jsonb),
  public.record_student_visual_turn(uuid,uuid,uuid,text,integer,boolean,jsonb),
  public.finish_learning_turn(uuid,uuid,uuid,uuid,jsonb,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_chat_visual(uuid,uuid,uuid,jsonb),
  public.open_private_chat_with_visual(uuid,uuid,jsonb),
  public.record_student_visual_turn(uuid,uuid,uuid,text,integer,boolean,jsonb),
  public.finish_learning_turn(uuid,uuid,uuid,uuid,jsonb,text,text,jsonb) to service_role;
