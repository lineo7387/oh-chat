-- ============================================================
-- oh-chat Storage Bucket for Voice Messages
-- ============================================================

-- Create the voice-messages bucket (private by default)
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', false);

-- RLS: Authenticated users can upload voice messages
-- Max ~10MB per file (generous for 60s opus recordings ~200KB)
create policy "Authenticated users can upload voice messages"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-messages');

-- RLS: Authenticated users can view/download voice messages
create policy "Authenticated users can view voice messages"
  on storage.objects for select to authenticated
  using (bucket_id = 'voice-messages');
