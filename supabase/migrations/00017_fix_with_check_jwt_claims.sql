-- Workaround: auth.uid() fails in WITH CHECK context.
-- Use request.jwt.claims->>'sub' instead, which PostgREST sets from the JWT.

 create or replace function public.get_auth_uid()
returns uuid
language plpgsql
stable
security definer
as $$
declare
  v_sub text;
begin
  v_sub := current_setting('request.jwt.claims', true)::jsonb->>'sub';
  if v_sub is null then
    return null;
  end if;
  return v_sub::uuid;
exception
  when others then
    return null;
end;
$$;

-- Conversations
 create or replace function public.check_conversation_creator(p_created_by uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_created_by = public.get_auth_uid();
end;
$$;

-- Friends
 create or replace function public.check_friend_sender(p_sender_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_sender_id = public.get_auth_uid();
end;
$$;

 create or replace function public.check_friend_member(p_sender_id uuid, p_receiver_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_sender_id = public.get_auth_uid() or p_receiver_id = public.get_auth_uid();
end;
$$;

 create or replace function public.check_friend_receiver(p_receiver_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_receiver_id = public.get_auth_uid();
end;
$$;

-- Messages
 create or replace function public.check_message_sender(p_sender_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_sender_id = public.get_auth_uid();
end;
$$;
