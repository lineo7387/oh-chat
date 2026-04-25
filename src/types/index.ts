export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  status: 'online' | 'offline' | 'away'
  last_seen: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  title: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_message_id: string | null
  role: 'owner' | 'admin' | 'member'
  unread_count: number
  last_read_at: string | null
  profile?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string
  type: 'text' | 'image' | 'file' | 'voice'
  reply_to_id: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  sender?: Profile
  reactions?: MessageReaction[]
  attachments?: Attachment[]
}

export interface MessageReaction {
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface Attachment {
  id: string
  message_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  created_at: string
}

export type FriendStatus = 'pending' | 'accepted' | 'rejected'

export interface Friend {
  id: string
  sender_id: string
  receiver_id: string
  status: FriendStatus
  created_at: string
  updated_at: string
  sender?: Profile
  receiver?: Profile
}

export interface ConversationSettings {
  user_id: string
  conversation_id: string
  custom_name: string | null
  is_muted: boolean
  is_pinned: boolean
  pinned_at: string | null
  is_hidden: boolean
  cleared_at: string | null
  updated_at: string
}
