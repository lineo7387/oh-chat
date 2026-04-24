-- ============================================================
-- Debug: temporarily relax conversations insert policy
-- to diagnose the 403 error
-- ============================================================

drop policy if exists "Authenticated users can create conversations" on public.conversations;

-- Allow any authenticated user to create a conversation
-- We'll tighten this back once we confirm the root cause
create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated with check (true);
