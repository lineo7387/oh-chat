-- Add is_hidden to conversation_settings for soft-delete of conversations from user's view

alter table public.conversation_settings
  add column is_hidden boolean not null default false;

-- Index for fast filtering of hidden conversations
create index idx_conversation_settings_hidden
  on public.conversation_settings (user_id, is_hidden)
  where is_hidden = true;
