alter table public.sessions add column activity_last_at timestamptz;

create function public.reset_activity_interval() returns trigger language plpgsql set search_path='' as $$
begin
  if new.status is distinct from old.status then new.activity_last_at := now(); end if;
  return new;
end; $$;
create trigger activity_status_change before update on public.sessions
  for each row execute function public.reset_activity_interval();

create function public.record_learning_activity(p_learner uuid,p_session_id uuid,p_event_id uuid,p_ms integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare s record; accepted integer;
begin
  select * into s from public.sessions where id=p_session_id for update;
  perform public.assert_learning_session_access(p_learner,p_session_id);
  if p_event_id is null or p_ms is null or p_ms not between 0 and 15000 then raise exception 'invalid_activity'; end if;
  if exists(select 1 from public.learning_events where id=p_event_id) then return 0; end if;
  accepted := case when s.status='awaiting_student' and s.activity_last_at is not null
    then greatest(0,least(p_ms,15000,floor(extract(epoch from (now()-s.activity_last_at))*1000)))::integer else 0 end;
  insert into public.learning_events(id,session_id,actor_id,event_name,sequence,permitted_metadata)
    values(p_event_id,p_session_id,p_learner,'activity',
      coalesce((select max(sequence)+1 from public.learning_events where session_id=p_session_id and event_name='activity'),0),
      jsonb_build_object('accepted_ms',accepted));
  update public.sessions set activity_last_at=now(),active_ms=active_ms+accepted where id=p_session_id;
  return accepted;
end; $$;

create function public.revise_learning_assessment(p_teacher uuid,p_evaluation uuid,p_expected_verdict text,p_verdict text,p_reason text)
returns text language plpgsql security invoker set search_path='' as $$
declare e record; s record; latest record; goal jsonb; goals jsonb; refs jsonb; effective text; state text; complete boolean;
begin
  select * into e from public.evaluations where id=p_evaluation;
  select * into s from public.sessions where id=e.session_id for update;
  if not found or s.visibility <> 'class' or not exists(select 1 from public.classes c
      join public.profiles p on p.auth_user_id=c.teacher_id and p.role='teacher'
      where c.id=s.class_id and c.teacher_id=p_teacher and c.active) then raise exception 'review_denied'; end if;
  perform public.assert_learning_session_access(s.learner_id,s.id);
  if s.status in ('evaluating','supervisor_pending','errby_ready') then raise exception 'review_busy'; end if;
  if p_verdict is null or p_verdict not in ('correct','partial','incorrect','unverified','off_topic')
    or p_reason is null or char_length(trim(p_reason)) not between 10 and 2000 then raise exception 'invalid_revision'; end if;
  select coalesce((select r.new_verdict from public.assessment_revisions r where r.evaluation_id=e.id order by r.created_at desc,r.id desc limit 1),e.verdict) into effective;
  if effective is distinct from p_expected_verdict then raise exception 'stale_revision'; end if;
  select objectives_json,reference_json into goals,refs from public.lesson_versions where id=s.lesson_version_id;
  select value into goal from jsonb_array_elements(goals) where value->>'id'=e.objective_id;
  -- A teacher verdict cannot manufacture a quote, independence or source evidence.
  if p_verdict='correct' and (goal is null or not coalesce(e.independent,false) or e.assisted
      or nullif(trim(e.learner_evidence_span),'') is null or jsonb_array_length(e.source_refs)=0
      or not exists(select 1 from public.messages m where m.id=e.message_id and m.role='student'
        and strpos(m.text,e.learner_evidence_span)>0)
      or exists(select 1 from public.messages m join public.messages a on a.id=e.message_id
        where m.session_id=s.id and m.role='supervisor' and m.sequence<a.sequence and lower(trim(m.text))=lower(trim(a.text)))
      or exists(select 1 from jsonb_array_elements_text(e.source_refs) r where not(goal->'reference_ids' ? r)
        or not exists(select 1 from jsonb_array_elements(refs) ref where ref->>'id'=r and ref->>'status'='source_checked' and ref->>'purpose'='evidence')))
    then raise exception 'invalid_completion_evidence'; end if;
  insert into public.assessment_revisions(evaluation_id,reviewer_id,old_verdict,new_verdict,reason)
    values(e.id,p_teacher,effective,p_verdict,trim(p_reason));
  update public.interventions set resolved=(p_verdict<>'unverified'),review_status='reviewed',reviewer_id=p_teacher
    where session_id=s.id and message_id=e.message_id and objective_id=e.objective_id and trigger in ('uncertainty','app_error');
  -- Progress follows the latest learner evidence, never an older overridden answer.
  select ev.*,coalesce((select r.new_verdict from public.assessment_revisions r where r.evaluation_id=ev.id order by r.created_at desc,r.id desc limit 1),ev.verdict) as effective
    into latest from public.evaluations ev join public.messages m on m.id=ev.message_id
    where ev.session_id=s.id and ev.objective_id=e.objective_id order by m.sequence desc limit 1;
  state := case when latest.effective='correct' and latest.independent and not latest.assisted then 'explained'
    when latest.effective='unverified' then 'unverified' else 'developing' end;
  insert into public.objective_progress(session_id,objective_id,state,evidence_evaluation_ids)
    values(s.id,e.objective_id,state,case when state='explained' then array[latest.id] else '{}'::uuid[] end)
    on conflict(session_id,objective_id) do update set state=excluded.state,evidence_evaluation_ids=excluded.evidence_evaluation_ids,revision=objective_progress.revision+1,updated_at=now();
  if state='explained' then
    update public.interventions set resolved=true where session_id=s.id and objective_id=e.objective_id and trigger='correction';
  end if;
  complete := jsonb_array_length(goals)>0 and not exists(select 1 from jsonb_array_elements(goals) g
    left join public.objective_progress p on p.session_id=s.id and p.objective_id=g->>'id'
    where coalesce((g->>'required')::boolean,true) and coalesce(p.state,'untested')<>'explained')
    and not exists(select 1 from public.interventions where session_id=s.id and not resolved);
  state := case when complete then 'completed'
    when exists(select 1 from public.objective_progress p where p.session_id=s.id and p.state='unverified')
      or exists(select 1 from public.interventions where session_id=s.id and not resolved and trigger in ('uncertainty','app_error')) then 'needs_review'
    when s.status='paused' then 'paused' else 'awaiting_student' end;
  update public.sessions set status=state,ended_at=case when complete then now() else null end,
    paused_from=case when state='paused' then 'awaiting_student' else null end where id=s.id;
  insert into public.learning_events(session_id,actor_id,event_name,sequence,permitted_metadata)
    values(s.id,p_teacher,'teacher_reviewed',coalesce((select max(sequence)+1 from public.learning_events where session_id=s.id and event_name='teacher_reviewed'),0),
      jsonb_build_object('evaluation_id',e.id,'objective_id',e.objective_id));
  return state;
end; $$;
revoke execute on function public.record_learning_activity(uuid,uuid,uuid,integer),public.revise_learning_assessment(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_learning_activity(uuid,uuid,uuid,integer),public.revise_learning_assessment(uuid,uuid,text,text,text) to service_role;
