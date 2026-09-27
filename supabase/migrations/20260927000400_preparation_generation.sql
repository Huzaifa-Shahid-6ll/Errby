-- Private practice preserves pending human review and never publishes a class lesson.
alter table public.lesson_versions drop constraint lesson_versions_review_status_check;
alter table public.lesson_versions add constraint lesson_versions_review_status_check
  check (review_status in ('draft','needs_review','approved','published','private_ready'));

create or replace function public.claim_preparation(p_owner uuid,p_job uuid,p_step integer)
returns public.preparation_jobs language plpgsql security invoker set search_path = '' as $$
declare job public.preparation_jobs;
begin
  select * into job from public.preparation_jobs where id=p_job and owner_id=p_owner for update;
  if not found then raise exception 'preparation_not_found'; end if;
  perform public.check_preparation_owner(p_owner,job.class_id);
  if job.current_step<>p_step or job.status in ('cancelled','ready') or job.current_step=2 then raise exception 'step_conflict'; end if;
  if job.lease_until>clock_timestamp() then raise exception 'preparation_busy'; end if;
  update public.preparation_jobs set lease_token=gen_random_uuid(),lease_until=clock_timestamp()+case when p_step=1 then interval '180 seconds' else interval '30 seconds' end,updated_at=clock_timestamp()
    where id=p_job returning * into job;
  return job;
end;
$$;

create or replace function public.finish_preparation(p_owner uuid,p_job uuid,p_token uuid,p_result jsonb,p_lesson jsonb default null,p_content_hash text default null,p_request_hash text default null)
returns public.preparation_jobs language plpgsql security invoker set search_path = '' as $$
declare job public.preparation_jobs; lesson uuid; version_id uuid;
begin
  select * into job from public.preparation_jobs where id=p_job and owner_id=p_owner for update;
  if not found then raise exception 'preparation_not_found'; end if;
  perform public.check_preparation_owner(p_owner,job.class_id);
  if p_token is null or job.lease_token is distinct from p_token or job.lease_until<=clock_timestamp() then raise exception 'lease_lost'; end if;
  if p_request_hash is null or p_request_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_preparation'; end if;
  if p_lesson is not null then
    if not exists(select 1 from public.profiles where auth_user_id=p_owner and (role='teacher' or
      (role='learner' and job.class_id is null and p_lesson->>'content_origin'='generated_draft')))
      then raise exception 'preparation_forbidden'; end if;
    if job.current_step<>1 or p_lesson->'teacher_review' is distinct from '{"status":"pending"}'::jsonb or
      (p_lesson->>'version')::integer<>1 or p_content_hash is null then raise exception 'invalid_draft'; end if;
    insert into public.lessons(owner_id,class_id,title) values(p_owner,job.class_id,p_lesson->>'title') returning id into lesson;
    insert into public.lesson_versions(lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,lesson_json,content_hash)
      values(lesson,1,p_lesson->'objectives',p_lesson->'references',
        jsonb_build_object('source_id',job.source_id,'input_hash',job.input_hash,'origin',p_lesson->>'content_origin','source_match_only',coalesce((p_result->>'private_ready')::boolean,false)),
        p_lesson->>'initial_question',case when job.class_id is null and
          exists(select 1 from public.profiles where auth_user_id=p_owner and role='learner') and
          p_lesson->>'content_origin'='generated_draft' and
          p_lesson->>'illustrative_only'='false' and
          p_result->>'private_ready'='true' and
          job.partial_results->'extraction'->>'source_role'='evidence' and
          jsonb_array_length(p_lesson->'references')>0 and
          not exists(select 1 from jsonb_array_elements(p_lesson->'references') r where r->>'status'<>'source_checked') and
          not exists(select 1 from jsonb_array_elements(p_lesson->'objectives') o where jsonb_array_length(o->'unresolved_issues')>0 or jsonb_array_length(o->'reference_ids')=0)
          then 'private_ready' else 'needs_review' end,p_lesson,p_content_hash) returning id into version_id;
    update public.preparation_jobs set current_step=2,status='needs_review',completed_steps=completed_steps || jsonb_build_object('1',p_request_hash),
      partial_results=partial_results || jsonb_build_object('lesson_id',lesson,'lesson_version_id',version_id),
      lease_token=null,lease_until=null,error_code=null,updated_at=clock_timestamp() where id=p_job returning * into job;
  else
    if job.current_step<>0 then raise exception 'step_conflict'; end if;
    update public.preparation_jobs set
      completed_steps=completed_steps || jsonb_build_object('0',p_request_hash),
      current_step=case when p_result->>'status'='extracted_needs_review' then 1 else 0 end,
      status=case when p_result->>'status'='extracted_needs_review' then 'drafting' else 'needs_clarification' end,
      partial_results=p_result,lease_token=null,lease_until=null,error_code=null,updated_at=clock_timestamp()
      where id=p_job returning * into job;
  end if;
  return job;
end;
$$;

