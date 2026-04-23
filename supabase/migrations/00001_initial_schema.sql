-- ============================================================
-- oh-chat Initial Schema Migration
-- ============================================================

-- -----------------------------------------------------------
-- 1. Custom Types (Enums)
-- -----------------------------------------------------------

create type user_status as enum ('online', 'offline', 'away');
create type conversation_type as enum ('direct', 'group');
create type participant_role as enum ('owner', 'admin', 'member');
create type message_type as enum ('text', 'image', 'file');

-- -----------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------

-- Profiles: extends auth.users with public user info
-- Triggered by auth.users insert (see section 5)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  status user_status not null default 'offline',
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conversations: chat rooms (direct or group)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type conversation_type not null default 'direct',
  title text,
  avatar_url text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conversation Participants: many-to-many join table
-- Note: last_read_message_id added after messages table is created
create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_message_id uuid,
  role participant_role not null default 'member',
  primary key (conversation_id, user_id)
);

-- Messages: chat messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null, -- null = system message
  content text not null,
  type message_type not null default 'text',
  reply_to_id uuid references public.messages(id) on delete set null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Message Reactions: emoji reactions to messages
create table public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- Attachments: file attachments linked to messages
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size int not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Add foreign key for last_read_message_id after messages table exists
alter table public.conversation_participants
  add constraint fk_last_read_message
  foreign key (last_read_message_id) references public.messages(id)
  on delete set null;

-- -----------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------

-- Messages: fast lookup by conversation + time
create index idx_messages_conversation_created
  on public.messages (conversation_id, created_at desc);

-- Messages: for reply references
create index idx_messages_reply_to
  on public.messages (reply_to_id)
  where reply_to_id is not null;

-- Conversation participants: fast lookup by user
create index idx_conversation_participants_user
  on public.conversation_participants (user_id);

-- Reactions: fast lookup by message
create index idx_message_reactions_message
  on public.message_reactions (message_id);

-- Attachments: fast lookup by message
create index idx_attachments_message
  on public.attachments (message_id);

-- Profiles: fast lookup by username
create index idx_profiles_username
  on public.profiles (username);

-- -----------------------------------------------------------
-- 4. Triggers: auto-update updated_at
-- -----------------------------------------------------------

-- Trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at_column();

create trigger update_messages_updated_at
  before update on public.messages
  for each row execute function public.update_updated_at_column();

-- -----------------------------------------------------------
-- 5. Triggers: auto-create profile on signup
-- -----------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------
-- 6. Row Level Security (RLS)
-- -----------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.attachments enable row level security;

-- Profiles: anyone can view, only self can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

-- Conversations: participants can view; authenticated can create
create policy "Conversations viewable by participants"
  on public.conversations for select to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
  ));

create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated with check (created_by = auth.uid());

create policy "Owners and admins can update conversations"
  on public.conversations for update to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
      and cp.role in ('owner', 'admin')
  ));

-- Conversation Participants: participants can view; owners/admins can manage
create policy "Participants viewable by members"
  on public.conversation_participants for select to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  ));

create policy "Owners and admins can add participants"
  on public.conversation_participants for insert to authenticated
  with check (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
      and cp.role in ('owner', 'admin')
  ));

create policy "Owners and admins can remove participants"
  on public.conversation_participants for delete to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
      and cp.role in ('owner', 'admin')
  ) or user_id = auth.uid()); -- users can also remove themselves

-- Messages: participants can view and send
create policy "Messages viewable by participants"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  ));

create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "Senders can update own messages"
  on public.messages for update to authenticated
  using (sender_id = auth.uid());

-- Message Reactions: participants can view and react
create policy "Reactions viewable by participants"
  on public.message_reactions for select to authenticated
  using (exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_id and cp.user_id = auth.uid()
  ));

create policy "Participants can add reactions"
  on public.message_reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_id and cp.user_id = auth.uid()
    )
  );

create policy "Users can remove own reactions"
  on public.message_reactions for delete to authenticated
  using (user_id = auth.uid());

-- Attachments: participants can view and upload
create policy "Attachments viewable by participants"
  on public.attachments for select to authenticated
  using (exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_id and cp.user_id = auth.uid()
  ));

create policy "Senders can add attachments"
  on public.attachments for insert to authenticated
  with check (exists (
    select 1 from public.messages m
    where m.id = message_id and m.sender_id = auth.uid()
  ));

-- -----------------------------------------------------------
-- 7. Realtime Configuration
-- -----------------------------------------------------------

-- Enable realtime for messages (live chat)
alter publication supabase_realtime add table public.messages;

-- Enable realtime for conversation_participants (member changes, read receipts)
alter publication supabase_realtime add table public.conversation_participants;

-- Enable realtime for profiles (online status updates)
alter publication supabase_realtime add table public.profiles;
