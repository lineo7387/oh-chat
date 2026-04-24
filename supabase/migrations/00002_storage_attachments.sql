-- ============================================================
-- oh-chat Storage Buckets for File Attachments
-- ============================================================

-- Create the attachments bucket (private by default)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false);

-- RLS: Authenticated users can upload files to attachments bucket
-- (Fine-grained access is enforced via the attachments table RLS)
create policy "Authenticated users can upload to attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');

-- RLS: Authenticated users can view/download files from attachments bucket
create policy "Authenticated users can view attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments');
