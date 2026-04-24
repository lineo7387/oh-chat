-- Fix conversation_participants INSERT: creator can add initial members
-- Fix messages INSERT: auth.uid() comparison wrapped in security definer

-- Conversations: allow creator to add participants even before any participants exist
 create or replace function public.check_can_add_participant(p_conversation_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  -- Creator of the conversation can always add participants
  if exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.created_by = auth.uid()
  ) then
    return true;
  end if;
  -- Otherwise must be owner/admin
  return public.is_conversation_owner_or_admin(p_conversation_id);
end;
$$;

 drop policy if exists "Owners and admins can add participants" on public.conversation_participants;
 create policy "Owners and admins can add participants"
  on public.conversation_participants for insert to authenticated
  with check (public.check_can_add_participant(conversation_id));

-- Messages: sender check via security definer
 create or replace function public.check_message_sender(p_sender_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select p_sender_id = auth.uid();
$$;

 drop policy if exists "Participants can send messages" on public.messages;
 create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    public.check_message_sender(sender_id)
    and public.is_conversation_member(conversation_id)
  );

-- Messages: update sender check
 drop policy if exists "Senders can update own messages" on public.messages;
 create policy "Senders can update own messages"
  on public.messages for update to authenticated
  using (public.check_message_sender(sender_id));
