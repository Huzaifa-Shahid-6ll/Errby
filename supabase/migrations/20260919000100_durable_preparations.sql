-- Durable bounded steps. Only server functions write; Auth/RLS reads stay scoped.
alter table public.preparation_jobs
  add column request_key uuid,
  add column source_id uuid references public.source_documents on delete cascade,
  add column lease_token uuid,
  add column completed_steps jsonb not null default '{}'::jsonb,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now(),
  add constraint preparation_request_unique unique(owner_id, request_key);
alter table public.lesson_versions
  add column lesson_json jsonb,
  add column content_hash text check(content_hash ~ '^[a-f0-9]{64}$'),
  add constraint lesson_snapshot_hash check ((lesson_json is null) = (content_hash is null));

create function public.protect_lesson_snapshot() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.lesson_json is not null then raise exception 'Lesson snapshots are immutable'; end if;
  return new;
end;
$$;
create trigger immutable_lesson_snapshot before update on public.lesson_versions
  for each row execute function public.protect_lesson_snapshot();

create function public.check_preparation_owner(p_owner uuid, p_class uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.profiles where auth_user_id=p_owner) or
    (p_class is not null and not exists(select 1 from public.classes where id=p_class and teacher_id=p_owner and active)) then
    raise exception 'preparation_forbidden';
  end if;
end;
$$;

create function public.create_preparation(p_owner uuid, p_class uuid, p_key uuid, p_hash text, p_result jsonb)
returns public.preparation_jobs language plpgsql security invoker set search_path = '' as $$
declare job public.preparation_jobs; source uuid; page jsonb;
begin
  perform public.check_preparation_owner(p_owner,p_class);
  if p_key is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_preparation'; end if;
  -- ponytail: creation serializes per owner; use key-level locking if bulk imports arrive.
  perform 1 from public.profiles where auth_user_id=p_owner for update;
  select * into job from public.preparation_jobs where owner_id=p_owner and request_key=p_key;
  if found then
    if job.input_hash<>p_hash or job.class_id is distinct from p_class then raise exception 'idempotency_conflict'; end if;
    return job;
  end if;
  if length(p_result->'extraction'->>'text') not between 1 and 31000 or
    jsonb_array_length(p_result->'extraction'->'pages') not between 1 and 50 then raise exception 'invalid_preparation'; end if;
  insert into public.source_documents(owner_id,class_id,kind,extraction_status,content_hash,provenance)
    values(p_owner,p_class,p_result->'extraction'->>'kind',
      case when p_result->>'status'='partial' then 'partial' else 'ready' end,
      p_result->'extraction'->>'sha256', (p_result->'extraction') - 'text' - 'pages' - 'sample') returning id into source;
  for page in select value from jsonb_array_elements(p_result->'extraction'->'pages') loop
    insert into public.source_chunks(source_id,ordinal,text,location,hash)
      values(source,(page->>'page')::integer-1,page->>'text',jsonb_build_object('page',(page->>'page')::integer), encode(sha256(convert_to(page->>'text','UTF8')),'hex'));
  end loop;
  insert into public.preparation_jobs(owner_id,class_id,request_key,source_id,input_hash,partial_results)
    values(p_owner,p_class,p_key,source,p_hash,p_result) returning * into job;
  return job;
end;
$$;

create function public.claim_preparation(p_owner uuid,p_job uuid,p_step integer)
returns public.preparation_jobs language plpgsql security invoker set search_path = '' as $$
declare job public.preparation_jobs;
begin
  select * into job from public.preparation_jobs where id=p_job and owner_id=p_owner for update;
  if not found then raise exception 'preparation_not_found'; end if;
  perform public.check_preparation_owner(p_owner,job.class_id);
  if job.current_step<>p_step or job.status in ('cancelled','ready') or job.current_step=2 then raise exception 'step_conflict'; end if;
  if job.lease_until>clock_timestamp() then raise exception 'preparation_busy'; end if;
  update public.preparation_jobs set lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '30 seconds',updated_at=clock_timestamp()
    where id=p_job returning * into job;
  return job;
end;
$$;

create function public.finish_preparation(p_owner uuid,p_job uuid,p_token uuid,p_result jsonb,p_lesson jsonb default null,p_content_hash text default null,p_request_hash text default null)
returns public.preparation_jobs language plpgsql security invoker set search_path = '' as $$
declare job public.preparation_jobs; lesson uuid; version_id uuid;
begin
  select * into job from public.preparation_jobs where id=p_job and owner_id=p_owner for update;
  if not found then raise exception 'preparation_not_found'; end if;
  perform public.check_preparation_owner(p_owner,job.class_id);
  if p_token is null or job.lease_token is distinct from p_token or job.lease_until<=clock_timestamp() then raise exception 'lease_lost'; end if;
  if p_request_hash is null or p_request_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_preparation'; end if;
  if p_lesson is not null then
    if not exists(select 1 from public.profiles where auth_user_id=p_owner and role='teacher') then raise exception 'preparation_forbidden'; end if;
    if job.current_step<>1 or p_lesson->'teacher_review' is distinct from '{"status":"pending"}'::jsonb or
      (p_lesson->>'version')::integer<>1 or p_content_hash is null then raise exception 'invalid_draft'; end if;
    insert into public.lessons(owner_id,class_id,title) values(p_owner,job.class_id,p_lesson->>'title') returning id into lesson;
    insert into public.lesson_versions(lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,lesson_json,content_hash)
      values(lesson,1,p_lesson->'objectives',p_lesson->'references',
        jsonb_build_object('source_id',job.source_id,'input_hash',job.input_hash,'origin','manual_unreviewed'),
        p_lesson->>'initial_question','needs_review',p_lesson,p_content_hash) returning id into version_id;
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

create function public.fail_preparation(p_owner uuid,p_job uuid,p_token uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.preparation_jobs set status='failed',error_code='step_failed',lease_token=null,lease_until=null,updated_at=clock_timestamp()
  where id=p_job and owner_id=p_owner and lease_token=p_token and lease_until>clock_timestamp();
$$;

revoke execute on function public.protect_lesson_snapshot() from public,anon,authenticated;
revoke execute on function public.check_preparation_owner(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.create_preparation(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke execute on function public.claim_preparation(uuid,uuid,integer) from public,anon,authenticated;
revoke execute on function public.finish_preparation(uuid,uuid,uuid,jsonb,jsonb,text,text) from public,anon,authenticated;
revoke execute on function public.fail_preparation(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.check_preparation_owner(uuid,uuid),public.create_preparation(uuid,uuid,uuid,text,jsonb),
  public.claim_preparation(uuid,uuid,integer),public.finish_preparation(uuid,uuid,uuid,jsonb,jsonb,text,text),
  public.fail_preparation(uuid,uuid,uuid) to service_role;
