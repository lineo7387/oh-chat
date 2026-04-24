-- Test: wrap auth.uid() comparison in security definer functions
-- to isolate whether direct auth.uid() in WITH CHECK is failing

-- Conversations: creator check
 create or replace function public.check_conversation_creator(p_created_by uuid)
returns boolean
language sql
stable
security definer
as $$
  select p_created_by = auth.uid();
$$;

 drop policy if exists "Authenticated users can create conversations" on public.conversations;
 create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated
  with check (public.check_conversation_creator(created_by));

-- Friends: sender check
 create or replace function public.check_friend_sender(p_sender_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select p_sender_id = auth.uid();
$$;

 drop policy if exists "Users can send friend requests" on public.friends;
 create policy "Users can send friend requests"
  on public.friends for insert to authenticated
  with check (public.check_friend_sender(sender_id));

-- Friends: user is sender or receiver
 create or replace function public.check_friend_member(p_sender_id uuid, p_receiver_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select p_sender_id = auth.uid() or p_receiver_id = auth.uid();
$$;

 drop policy if exists "Users can view own friend records" on public.friends;
 create policy "Users can view own friend records"
  on public.friends for select to authenticated
  using (public.check_friend_member(sender_id, receiver_id));

-- Friends: receiver can update
 create or replace function public.check_friend_receiver(p_receiver_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select p_receiver_id = auth.uid();
$$;

 drop policy if exists "Receivers can accept or reject requests" on public.friends;
 create policy "Receivers can accept or reject requests"
  on public.friends for update to authenticated
  using (public.check_friend_receiver(receiver_id));

-- Friends: either party can delete
 drop policy if exists "Users can delete own friend records" on public.friends;
 create policy "Users can delete own friend records"
  on public.friends for delete to authenticated
  using (public.check_friend_member(sender_id, receiver_id));
