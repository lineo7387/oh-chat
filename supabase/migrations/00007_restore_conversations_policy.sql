-- ============================================================
-- Restore secure conversations insert policy + add debug logging
-- ============================================================

drop policy if exists "Authenticated users can create conversations" on public.conversations;

create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated with check (created_by = auth.uid());
