-- Append-only teacher workflow. The preparation points at the current draft.
create function public.advance_lesson_review(p_teacher uuid, p_job uuid, p_expected uuid, p_action text, p_lesson jsonb default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare job public.preparation_jobs; parent public.lessons; previous public.lesson_versions; next_json jsonb; next_id uuid; next_version integer; next_status text;
begin
  select * into job from public.preparation_jobs where id=p_job and owner_id=p_teacher for update;
  if not found or job.current_step<>2 or job.partial_results->>'lesson_version_id' is distinct from p_expected::text then raise exception 'stale_lesson'; end if;
  if not exists(select 1 from public.profiles where auth_user_id=p_teacher and role='teacher') then raise exception 'teacher_required'; end if;
  if job.class_id is null or not exists(select 1 from public.classes where id=job.class_id and teacher_id=p_teacher and active) then raise exception 'class_required'; end if;
  select * into previous from public.lesson_versions where id=p_expected and id=(job.partial_results->>'lesson_version_id')::uuid;
  select * into parent from public.lessons where id=previous.lesson_id and owner_id=p_teacher and class_id=job.class_id for update;
  if not found or parent.archived_at is not null then raise exception 'lesson_unavailable'; end if;
  next_version:=previous.version+1;
  if p_action='edit' then
    if p_lesson is null or p_lesson->'teacher_review' <> '{"status":"pending"}'::jsonb or (p_lesson->>'version')::integer<>next_version or p_lesson->>'id'<>previous.lesson_json->>'id' then raise exception 'invalid_draft'; end if;
    next_json:=p_lesson; next_status:='needs_review';
  elsif p_action='review' then
    if previous.review_status<>'needs_review' or p_lesson is not null then raise exception 'review_unavailable'; end if;
    next_json:=jsonb_set(jsonb_set(previous.lesson_json,'{version}',to_jsonb(next_version)), '{teacher_review}', jsonb_build_object('status','approved','reviewer_id',p_teacher,'reviewed_at',to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'lesson_version',next_version));
    next_status:='approved';
  elsif p_action='publish' then
    if previous.review_status<>'approved' or previous.reviewer_id<>p_teacher or p_lesson is not null then raise exception 'review_unavailable'; end if;
    next_json:=jsonb_set(jsonb_set(previous.lesson_json,'{version}',to_jsonb(next_version)), '{teacher_review,lesson_version}',to_jsonb(next_version));
    next_status:='published';
  else raise exception 'invalid_action'; end if;
  insert into public.lesson_versions(lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,reviewer_id,reviewed_at,lesson_json,content_hash)
    values(parent.id,next_version,next_json->'objectives',next_json->'references',previous.provenance,next_json->>'initial_question',next_status,
      case when next_status in ('approved','published') then p_teacher else null end,
      case when next_status in ('approved','published') then clock_timestamp() else null end,
      next_json,encode(sha256(convert_to(next_json::text,'UTF8')),'hex')) returning id into next_id;
  update public.preparation_jobs set partial_results=jsonb_set(partial_results,'{lesson_version_id}',to_jsonb(next_id::text)),updated_at=clock_timestamp() where id=p_job;
  if p_action='publish' then update public.lessons set current_published_version=next_id,title=next_json->>'title' where id=parent.id; end if;
  return next_id;
end; $$;
revoke all on function public.advance_lesson_review(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.advance_lesson_review(uuid,uuid,uuid,text,jsonb) to service_role;
