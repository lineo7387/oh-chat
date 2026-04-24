-- ============================================================
-- Fix RLS infinite recursion in conversation_participants
-- ============================================================

-- Helper function: check if current user is a member of a conversation
-- Uses security definer to bypass RLS and avoid infinite recursion
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = auth.uid()
  );
end;
$$;

-- Helper function: check if current user is owner or admin of a conversation
create or replace function public.is_conversation_owner_or_admin(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
      and cp.role in ('owner', 'admin')
  );
end;
$$;

-- Drop old recursive policies on conversation_participants
drop policy if exists "Participants viewable by members" on public.conversation_participants;
drop policy if exists "Owners and admins can add participants" on public.conversation_participants;
drop policy if exists "Owners and admins can remove participants" on public.conversation_participants;

-- Recreate policies using helper functions (no self-reference)
create policy "Participants viewable by members"
  on public.conversation_participants for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "Owners and admins can add participants"
  on public.conversation_participants for insert to authenticated
  with check (public.is_conversation_owner_or_admin(conversation_id));

create policy "Owners and admins can remove participants"
  on public.conversation_participants for delete to authenticated
  using (public.is_conversation_owner_or_admin(conversation_id) or user_id = auth.uid());
