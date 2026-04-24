-- Atomic conversation creation via RPC to bypass RLS edge cases
-- Creates a direct conversation and both participants in a single transaction

create or replace function public.create_direct_conversation(p_created_by uuid, p_other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_conv_id uuid;
begin
  -- Insert the conversation
  insert into public.conversations (type, created_by)
  values ('direct', p_created_by)
  returning id into v_conv_id;

  -- Insert both participants
  insert into public.conversation_participants (conversation_id, user_id, role)
  values
    (v_conv_id, p_created_by, 'owner'),
    (v_conv_id, p_other_user_id, 'member');

  return v_conv_id;
end;
$$;
