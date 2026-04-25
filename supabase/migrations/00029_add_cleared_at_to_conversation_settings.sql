alter table conversation_settings
  add column cleared_at timestamptz;

create index idx_conversation_settings_cleared
  on conversation_settings(user_id, conversation_id)
  where cleared_at is not null;
