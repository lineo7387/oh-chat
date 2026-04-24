-- Fix friends table SELECT/UPDATE/DELETE RLS with security definer wrappers
-- (Same pattern as 00013 for INSERT)

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
