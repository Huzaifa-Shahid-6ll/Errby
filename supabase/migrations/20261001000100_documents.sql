-- Originals are private and accessible only through owner-authorized server routes.
create table public.uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  name text not null check (length(name) between 1 and 160),
  kind text not null check (kind in ('pdf','docx')),
  bytes integer not null check (bytes between 1 and 4194304),
  storage_path text not null unique,
  extraction jsonb not null,
  state text not null default 'uploading' check (state in ('uploading','ready','deleting','failed')),
  created_at timestamptz not null default now()
);
alter table public.uploaded_documents enable row level security;
revoke all on public.uploaded_documents from anon,authenticated;
grant all on public.uploaded_documents to service_role;

create function public.reserve_document(p_owner uuid,p_id uuid,p_name text,p_kind text,p_bytes integer,p_extraction jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.profiles where auth_user_id=p_owner for update;
  if not found or exists(select 1 from public.clerk_identities where user_id=p_owner and deletion_requested_at is not null) then raise exception 'document_forbidden'; end if;
  if (select count(*) from public.uploaded_documents where owner_id=p_owner)>=20 then raise exception 'document_limit'; end if;
  if jsonb_array_length(p_extraction->'pages') not between 1 and 50 or length(p_extraction->>'text') not between 1 and 31000 or p_extraction->>'kind'<>p_kind then raise exception 'invalid_document'; end if;
  insert into public.uploaded_documents(id,owner_id,name,kind,bytes,storage_path,extraction)
    values(p_id,p_owner,p_name,p_kind,p_bytes,p_owner::text || '/' || p_id::text || '.' || p_kind,p_extraction);
end;
$$;
revoke all on function public.reserve_document(uuid,uuid,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_document(uuid,uuid,text,text,integer,jsonb) to service_role;
