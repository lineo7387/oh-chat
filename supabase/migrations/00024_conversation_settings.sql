-- ============================================================
-- oh-chat Conversation Settings (custom name, mute, pin)
-- ============================================================

-- Per-user, per-conversation preferences
-- Composite PK on (user_id, conversation_id) enforces one settings row per user per conv

create table public.conversation_settings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  custom_name text,
  is_muted boolean not null default false,
  is_pinned boolean not null default false,
  pinned_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

-- Fast lookups
 create index idx_conversation_settings_user
   on public.conversation_settings (user_id);
 create index idx_conversation_settings_conversation
   on public.conversation_settings (conversation_id);
 create index idx_conversation_settings_pinned
   on public.conversation_settings (user_id, is_pinned, pinned_at desc)
   where is_pinned = true;

-- Auto-update updated_at
create trigger update_conversation_settings_updated_at
  before update on public.conversation_settings
  for each row execute function public.update_updated_at_column();

-- -----------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------

alter table public.conversation_settings enable row level security;

-- Users can view their own settings
create policy "Users can view own conversation settings"
  on public.conversation_settings for select to authenticated
  using (user_id = auth.uid());

-- Users can insert their own settings
create policy "Users can insert own conversation settings"
  on public.conversation_settings for insert to authenticated
  with check (user_id = auth.uid());

-- Users can update their own settings
create policy "Users can update own conversation settings"
  on public.conversation_settings for update to authenticated
  using (user_id = auth.uid());

-- Users can delete their own settings
create policy "Users can delete own conversation settings"
  on public.conversation_settings for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------
-- Realtime Configuration
-- -----------------------------------------------------------

alter publication supabase_realtime add table public.conversation_settings;
