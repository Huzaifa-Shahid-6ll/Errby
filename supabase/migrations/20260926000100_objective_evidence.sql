-- T11: only the server may record a validated assessment. This transaction
-- binds evidence to the saved learner turn and the session's pinned version.
create function public.record_objective_evidence(
  p_session_id uuid, p_message_id uuid, p_assessments jsonb,
  p_rubric_version text, p_model_id text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  s record;
  answer record;
  goals jsonb;
  refs jsonb;
  item jsonb;
  goal jsonb;
  evidence_id uuid;
  state text;
  goal_id text;
begin
  select * into s from public.sessions where id = p_session_id for update;
  if not found or s.status <> 'evaluating' then raise exception 'session_not_evaluating'; end if;
  select * into answer from public.messages
    where id = p_message_id and session_id = p_session_id and role = 'student';
  if not found or answer.sequence <> s.last_sequence then raise exception 'invalid_evidence_message'; end if;
  select objectives_json, reference_json into goals, refs from public.lesson_versions where id = s.lesson_version_id;
  if jsonb_typeof(p_assessments) <> 'array' or jsonb_array_length(p_assessments) not between 1 and 5
    or nullif(p_rubric_version, '') is null or nullif(p_model_id, '') is null then
    raise exception 'invalid_evidence';
  end if;
  for item in select value from jsonb_array_elements(p_assessments) loop
    goal_id := item->>'objective_id';
    select value into goal from jsonb_array_elements(goals) where value->>'id' = goal_id;
    if goal is null or item->>'verdict' not in ('correct','partial','incorrect','unverified','off_topic')
      or jsonb_typeof(item->'reference_ids') <> 'array'
      or strpos(answer.text, coalesce(item->>'learner_quote','')) = 0
      or exists (select 1 from public.evaluations where message_id = p_message_id and objective_id = goal_id)
      then raise exception 'invalid_evidence'; end if;
    if item->>'verdict' = 'correct' and (nullif(item->>'learner_quote','') is null
      or jsonb_array_length(item->'reference_ids') = 0
      or (item->>'independent' = 'true' and exists (
        select 1 from public.messages correction
        where correction.session_id = p_session_id and correction.role = 'supervisor'
          and correction.sequence < answer.sequence
          and lower(trim(correction.text)) = lower(trim(answer.text))))
      or exists (select 1 from jsonb_array_elements_text(item->'reference_ids') r
                 where not (goal->'reference_ids' ? r)
                   or not exists (select 1 from jsonb_array_elements(refs) source_ref
                     where source_ref->>'id' = r and source_ref->>'purpose' = 'evidence'
                       and source_ref->>'status' = 'source_checked'))) then
      raise exception 'invalid_completion_evidence';
    end if;
    insert into public.evaluations(session_id,message_id,objective_id,verdict,
      learner_evidence_span,source_refs,assisted,uncertainty_reason,rubric_version,model_id)
    values (p_session_id,p_message_id,goal_id,item->>'verdict',item->>'learner_quote',
      item->'reference_ids',(item->>'assisted')::boolean,item->>'uncertainty_reason',
      p_rubric_version,p_model_id) returning id into evidence_id;
    state := case when item->>'verdict' = 'correct' and item->>'independent' = 'true'
      and item->>'assisted' = 'false' then 'explained'
      when item->>'verdict' = 'unverified' then 'unverified' else 'developing' end;
    insert into public.objective_progress(session_id,objective_id,state,evidence_evaluation_ids)
      values (p_session_id,goal_id,state,case when state = 'explained' then array[evidence_id] else '{}'::uuid[] end)
    on conflict (session_id,objective_id) do update set
      state = case when excluded.state = 'unverified' then 'unverified'
                   when excluded.state = 'developing' and objective_progress.state = 'explained' then 'developing'
                   when excluded.state = 'explained' then 'explained'
                   else objective_progress.state end,
      evidence_evaluation_ids = case when excluded.state = 'explained'
        then objective_progress.evidence_evaluation_ids || evidence_id
        else objective_progress.evidence_evaluation_ids end,
      revision = objective_progress.revision + 1, updated_at = now();
  end loop;
  if not exists (
    select 1 from jsonb_array_elements(goals) g
    left join public.objective_progress p on p.session_id = p_session_id
      and p.objective_id = g->>'id'
    where coalesce((g->>'required')::boolean, true) and coalesce(p.state, 'untested') <> 'explained'
  ) and not exists (select 1 from public.interventions
    where session_id = p_session_id and not resolved)
  then
    update public.sessions set status = 'completed', ended_at = now() where id = p_session_id;
    return 'completed';
  end if;
  update public.sessions set status = 'needs_review' where id = p_session_id;
  return 'needs_review';
end;
$$;
revoke execute on function public.record_objective_evidence(uuid,uuid,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.record_objective_evidence(uuid,uuid,jsonb,text,text) to service_role;
