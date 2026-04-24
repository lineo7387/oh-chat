-- ============================================================
-- oh-chat: Extend conversation_participants and messages
-- ============================================================

-- 1. Extend conversation_participants with unread tracking
alter table public.conversation_participants
  add column if not exists unread_count int not null default 0,
  add column if not exists last_read_at timestamptz;

-- 2. Add 'voice' to message_type enum
alter type public.message_type add value if not exists 'voice';
