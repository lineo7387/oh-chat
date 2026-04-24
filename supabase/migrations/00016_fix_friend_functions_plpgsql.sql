-- Convert friend RLS helper functions from language sql to plpgsql
-- (is_conversation_member works with plpgsql; sql variants may behave differently)

-- Friend sender check
 create or replace function public.check_friend_sender(p_sender_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_sender_id = auth.uid();
end;
$$;

-- Friend member check (sender or receiver)
 create or replace function public.check_friend_member(p_sender_id uuid, p_receiver_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_sender_id = auth.uid() or p_receiver_id = auth.uid();
end;
$$;

-- Friend receiver check
 create or replace function public.check_friend_receiver(p_receiver_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_receiver_id = auth.uid();
end;
$$;

-- Also convert conversation creator check for consistency
 create or replace function public.check_conversation_creator(p_created_by uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_created_by = auth.uid();
end;
$$;

-- Also convert message sender check for consistency
 create or replace function public.check_message_sender(p_sender_id uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_sender_id = auth.uid();
end;
$$;

-- Enable realtime for friends table
alter publication supabase_realtime add table public.friends;
