-- Atomic friend request creation via RPC to bypass RLS edge cases

create or replace function public.send_friend_request(p_sender_id uuid, p_receiver_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_record_id uuid;
begin
  -- Prevent self-friendship
  if p_sender_id = p_receiver_id then
    raise exception 'Cannot add yourself';
  end if;

  insert into public.friends (sender_id, receiver_id, status)
  values (p_sender_id, p_receiver_id, 'pending')
  returning id into v_record_id;

  return v_record_id;
exception
  when unique_violation then
    raise exception 'Friend request already exists';
end;
$$;
