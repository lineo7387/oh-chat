-- ============================================================
-- oh-chat Friends System
-- ============================================================

-- Friends table: tracks friend requests and accepted friendships
-- sender_id = who sent the request
-- receiver_id = who received the request
-- status: pending | accepted | rejected
-- A unique constraint on (least, greatest) prevents duplicate requests

create table public.friends (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate friend relationships regardless of direction
-- We use a unique index on ordered pair to ensure A->B and B->A are treated as one
create unique index idx_friends_unique_pair
  on public.friends (least(sender_id, receiver_id), greatest(sender_id, receiver_id));

-- Fast lookups
 create index idx_friends_sender on public.friends (sender_id);
 create index idx_friends_receiver on public.friends (receiver_id);
 create index idx_friends_status on public.friends (status);

-- Auto-update updated_at
create trigger update_friends_updated_at
  before update on public.friends
  for each row execute function public.update_updated_at_column();

-- -----------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------

alter table public.friends enable row level security;

-- Users can view friend records where they are sender or receiver
create policy "Users can view own friend records"
  on public.friends for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Users can send friend requests (sender_id must be themselves)
create policy "Users can send friend requests"
  on public.friends for insert to authenticated
  with check (sender_id = auth.uid());

-- Only the receiver can update (accept/reject) a pending request
create policy "Receivers can accept or reject requests"
  on public.friends for update to authenticated
  using (receiver_id = auth.uid());

-- Either party can delete a friend record
create policy "Users can delete own friend records"
  on public.friends for delete to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
