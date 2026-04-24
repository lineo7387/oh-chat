-- ============================================================
-- Fix: allow conversation creator to add participants
-- ============================================================

-- is_conversation_owner_or_admin must also check conversations.created_by
-- so the creator can add the first participants before any exist
create or replace function public.is_conversation_owner_or_admin(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.created_by = auth.uid()
  ) or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
      and cp.role in ('owner', 'admin')
  );
end;
$$;
