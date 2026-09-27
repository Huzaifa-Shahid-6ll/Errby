alter table public.model_budget add column max_call_usd numeric(12,6) not null default 0.03
  check (max_call_usd > 0 and max_call_usd <= 1);
alter table public.usage_ledger add column model_id text;
alter table public.usage_ledger add column provider_request_id text;
alter table public.usage_ledger add column response_json jsonb;

create or replace function public.reserve_model_cost(
  p_request_key uuid, p_owner uuid, p_role text, p_max_cost numeric
) returns text language plpgsql security invoker set search_path = '' as $$
declare b record; existing record; committed numeric; active_count integer;
begin
  if p_request_key is null or p_owner is null or p_role is null or p_role not in ('preparation','evaluation','errby')
    or p_max_cost is null or p_max_cost <= 0 or p_max_cost > 1 then raise exception 'invalid_reservation'; end if;
  -- ponytail: global lock suits the bounded demo; partition budgets if throughput requires it.
  perform pg_advisory_xact_lock(17026, 1);
  select * into existing from public.usage_ledger where request_key = p_request_key;
  if found then
    if existing.owner_scope is distinct from p_owner or existing.role <> p_role
      or existing.reserved_cost <> p_max_cost then raise exception 'reservation_conflict'; end if;
    return existing.provider_status;
  end if;
  select * into b from public.model_budget where id = true;
  if not found or not b.enabled then raise exception 'model_budget_disabled'; end if;
  if p_max_cost > b.max_call_usd then raise exception 'model_call_limit'; end if;
  select coalesce(sum(case when provider_status in ('reserved','pending') then reserved_cost
    else coalesce(actual_cost, 0) end), 0),
    count(*) filter (where provider_status in ('reserved','pending'))
    into committed, active_count from public.usage_ledger;
  if active_count >= 2 then raise exception 'model_concurrency_limit'; end if;
  if committed + p_max_cost > b.cap_usd * 0.9 then raise exception 'model_budget_exhausted'; end if;
  insert into public.usage_ledger(request_key,owner_scope,role,reserved_cost,provider_status,lease_until)
    values (p_request_key,p_owner,p_role,p_max_cost,'reserved',now() + interval '2 minutes');
  return 'reserved';
end;
$$;

-- Reservation replay is not permission to dispatch. Exactly one worker can claim.
create function public.claim_model_request(p_request_key uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare claimed integer;
begin
  perform pg_advisory_xact_lock(17026, 1);
  if not exists(select 1 from public.model_budget where id and enabled) then
    raise exception 'model_budget_disabled';
  end if;
  update public.usage_ledger set provider_status = 'pending'
    where request_key = p_request_key and provider_status = 'reserved' and lease_until > now()
      and reserved_cost <= (select max_call_usd from public.model_budget where id);
  get diagnostics claimed = row_count;
  return claimed = 1;
end;
$$;

drop function public.settle_model_cost(uuid,text,integer,numeric);
create function public.settle_model_cost(
  p_request_key uuid, p_status text, p_tokens integer, p_actual_cost numeric,
  p_model_id text default null, p_provider_id text default null, p_response_json jsonb default null
) returns text language plpgsql security invoker set search_path = '' as $$
declare entry record;
begin
  if p_status is null or p_status not in ('succeeded','failed','released') or p_tokens is null or p_tokens < 0
    or p_actual_cost is null or p_actual_cost < 0
    or length(p_model_id) > 200 or length(p_provider_id) > 200 then raise exception 'invalid_settlement'; end if;
  perform pg_advisory_xact_lock(17026, 1);
  select * into entry from public.usage_ledger where request_key = p_request_key for update;
  if not found then raise exception 'reservation_missing'; end if;
  if p_actual_cost > entry.reserved_cost then raise exception 'reservation_exceeded'; end if;
  if entry.provider_status in ('succeeded','failed','released') then
    if entry.provider_status <> p_status or entry.actual_tokens <> p_tokens
      or entry.actual_cost <> p_actual_cost
      or (p_model_id is not null and entry.model_id is distinct from p_model_id)
      or (p_provider_id is not null and entry.provider_request_id is distinct from p_provider_id)
      or (p_response_json is not null and entry.response_json is distinct from p_response_json)
      then raise exception 'settlement_conflict'; end if;
    return entry.provider_status;
  end if;
  -- Unknown provider outcomes must stay pending until billing is reconciled.
  if p_status = 'released' and (entry.provider_status <> 'reserved' or p_actual_cost <> 0 or p_tokens <> 0)
    then raise exception 'release_requires_undispatched_request'; end if;
  update public.usage_ledger set provider_status = p_status, actual_tokens = p_tokens,
    actual_cost = p_actual_cost, settled_at = now(), model_id = p_model_id,
    provider_request_id = p_provider_id, response_json = p_response_json where request_key = p_request_key;
  return p_status;
end;
$$;

revoke all on function public.claim_model_request(uuid) from public, anon, authenticated;
revoke all on function public.settle_model_cost(uuid,text,integer,numeric,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.claim_model_request(uuid) to service_role;
grant execute on function public.settle_model_cost(uuid,text,integer,numeric,text,text,jsonb) to service_role;

-- Billing totals survive account deletion; generated content does not.
create function public.scrub_deleted_owner_model_response() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.owner_scope is null then new.response_json = null; end if;
  return new;
end;
$$;
create trigger scrub_deleted_owner_model_response before update on public.usage_ledger
for each row execute function public.scrub_deleted_owner_model_response();

create or replace function public.expire_learner_records() returns integer language plpgsql security invoker set search_path = '' as $$
declare removed integer;
begin
  update public.usage_ledger set response_json = null
    where created_at < now() - interval '30 days' and response_json is not null;
  delete from public.sessions where opened_at < now() - interval '90 days';
  update public.sessions set status = 'ended_incomplete', ended_at = now(), lease_until = null
    where opened_at < now() - interval '30 days'
      and status not in ('completed','ended_incomplete');
  update public.messages m set text = '[Conversation expired]', source_refs_json = '[]'::jsonb
    from public.sessions s where m.session_id = s.id
      and s.opened_at < now() - interval '30 days' and m.text <> '[Conversation expired]';
  get diagnostics removed = row_count;
  update public.evaluations e set learner_evidence_span = '[Conversation expired]'
    from public.sessions s where e.session_id = s.id
      and s.opened_at < now() - interval '30 days'
      and e.learner_evidence_span <> '[Conversation expired]';
  update public.interventions i set correction = '[Conversation expired]'
    from public.sessions s where i.session_id = s.id
      and s.opened_at < now() - interval '30 days'
      and i.correction <> '[Conversation expired]';
  update public.learning_events e set permitted_metadata = '{}'::jsonb
    from public.sessions s where e.session_id = s.id
      and s.opened_at < now() - interval '30 days'
      and e.permitted_metadata <> '{}'::jsonb;
  return removed;
end;
$$;
revoke all on function public.expire_learner_records() from public, anon, authenticated;
grant execute on function public.expire_learner_records() to service_role;

