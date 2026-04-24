-- Update create_direct_conversation to use auth.uid() (works reliably in RPC context)

create or replace function public.create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_my_id uuid;
  v_conv_id uuid;
  v_existing_id uuid;
begin
  v_my_id := auth.uid();
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Prevent self-chat
  if v_my_id = p_other_user_id then
    raise exception 'Cannot chat with yourself';
  end if;

  -- Check if direct conversation already exists
  select c.id into v_existing_id
  from public.conversations c
  where c.type = 'direct'
    and exists (
      select 1 from public.conversation_participants cp1
      where cp1.conversation_id = c.id and cp1.user_id = v_my_id
    )
    and exists (
      select 1 from public.conversation_participants cp2
      where cp2.conversation_id = c.id and cp2.user_id = p_other_user_id
    )
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  -- Create conversation
  insert into public.conversations (type, created_by)
  values ('direct', v_my_id)
  returning id into v_conv_id;

  -- Add both participants
  insert into public.conversation_participants (conversation_id, user_id, role)
  values
    (v_conv_id, v_my_id, 'owner'),
    (v_conv_id, p_other_user_id, 'member');

  return v_conv_id;
end;
$$;
