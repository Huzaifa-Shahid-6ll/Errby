-- No provider request is permitted until an operator explicitly sets an approved cap.
create table public.model_budget (
  id boolean primary key default true check (id),
  cap_usd numeric(12,6) not null check (cap_usd > 0),
  enabled boolean not null default false
);
alter table public.model_budget enable row level security;
revoke all on public.model_budget from public, anon, authenticated;
grant all on public.model_budget to service_role;

alter table public.usage_ledger add column lease_until timestamptz;
alter table public.usage_ledger add column settled_at timestamptz;
alter table public.usage_ledger add constraint usage_actual_within_reservation
  check (actual_cost is null or actual_cost <= reserved_cost);
create index usage_active_reservations on public.usage_ledger(provider_status)
  where provider_status in ('reserved', 'pending');

create function public.reserve_model_cost(
  p_request_key uuid, p_owner uuid, p_role text, p_max_cost numeric
) returns text language plpgsql security invoker set search_path = '' as $$
declare b record; existing record; committed numeric; active_count integer;
begin
  if p_request_key is null or p_owner is null or p_role not in ('preparation','evaluation','errby')
    or p_max_cost is null or p_max_cost <= 0 or p_max_cost > 1 then raise exception 'invalid_reservation'; end if;
  perform pg_advisory_xact_lock(17026, 1);
  select * into existing from public.usage_ledger where request_key = p_request_key;
  if found then
    if existing.owner_scope is distinct from p_owner or existing.role <> p_role
      or existing.reserved_cost <> p_max_cost then raise exception 'reservation_conflict'; end if;
    return existing.provider_status;
  end if;
  select * into b from public.model_budget where id = true;
  if not found or not b.enabled then raise exception 'model_budget_disabled'; end if;
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

create function public.settle_model_cost(
  p_request_key uuid, p_status text, p_tokens integer, p_actual_cost numeric
) returns text language plpgsql security invoker set search_path = '' as $$
declare entry record;
begin
  if p_status not in ('succeeded','failed','released') or p_tokens is null or p_tokens < 0
    or p_actual_cost is null or p_actual_cost < 0 then raise exception 'invalid_settlement'; end if;
  perform pg_advisory_xact_lock(17026, 1);
  select * into entry from public.usage_ledger where request_key = p_request_key for update;
  if not found then raise exception 'reservation_missing'; end if;
  if p_actual_cost > entry.reserved_cost then raise exception 'reservation_exceeded'; end if;
  if entry.provider_status in ('succeeded','failed','released') then
    if entry.provider_status <> p_status or entry.actual_tokens <> p_tokens
      or entry.actual_cost <> p_actual_cost then raise exception 'settlement_conflict'; end if;
    return entry.provider_status;
  end if;
  update public.usage_ledger set provider_status = p_status, actual_tokens = p_tokens,
    actual_cost = p_actual_cost, settled_at = now() where request_key = p_request_key;
  return p_status;
end;
$$;

revoke all on function public.reserve_model_cost(uuid,uuid,text,numeric) from public, anon, authenticated;
revoke all on function public.settle_model_cost(uuid,text,integer,numeric) from public, anon, authenticated;
grant execute on function public.reserve_model_cost(uuid,uuid,text,numeric) to service_role;
grant execute on function public.settle_model_cost(uuid,text,integer,numeric) to service_role;

-- A retention job must run with service credentials; no scheduled job is silently assumed.
create function public.expire_learner_records() returns integer language plpgsql security invoker set search_path = '' as $$
declare removed integer;
begin
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
