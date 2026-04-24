-- ============================================================
-- oh-chat: Unread count auto-increment + mark-as-read function
-- ============================================================

-- 1. Trigger function: increment unread_count on new message
--    - Skips the sender
--    - Skips muted conversations (is_muted = true in conversation_settings)
create or replace function public.increment_unread_on_message()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.conversation_participants
  set unread_count = unread_count + 1
  where conversation_id = new.conversation_id
    and user_id != new.sender_id
    and not exists (
      select 1 from public.conversation_settings cs
      where cs.user_id = public.conversation_participants.user_id
        and cs.conversation_id = new.conversation_id
        and cs.is_muted = true
    );
  return new;
end;
$$;

create trigger trigger_increment_unread_on_message
  after insert on public.messages
  for each row execute function public.increment_unread_on_message();

-- 2. Function: mark conversation as read for current user
--    - Resets unread_count to 0
--    - Updates last_read_at to now()
create or replace function public.mark_conversation_as_read(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_my_id uuid;
begin
  v_my_id := auth.uid();
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.conversation_participants
  set unread_count = 0,
      last_read_at = now()
  where conversation_id = p_conversation_id
    and user_id = v_my_id;
end;
$$;

grant execute on function public.mark_conversation_as_read(uuid) to authenticated;
