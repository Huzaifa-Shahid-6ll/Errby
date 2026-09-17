-- No object policies yet: all uploads/downloads are denied to app users until
-- an authorised ingestion flow with scoped signed URLs is implemented.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('source-documents', 'source-documents', false, 10485760,
  array['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;
