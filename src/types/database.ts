export interface Database {
  public: {
    Enums: {
      user_status: 'online' | 'offline' | 'away'
      conversation_type: 'direct' | 'group'
      participant_role: 'owner' | 'admin' | 'member'
      message_type: 'text' | 'image' | 'file'
    }
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: 'online' | 'offline' | 'away'
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: 'online' | 'offline' | 'away'
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          type: 'direct' | 'group'
          title: string | null
          avatar_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type?: 'direct' | 'group'
          title?: string | null
          avatar_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'direct' | 'group'
          title?: string | null
          avatar_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_message_id: string | null
          role: 'owner' | 'admin' | 'member'
        }
        Insert: {
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_message_id?: string | null
          role?: 'owner' | 'admin' | 'member'
        }
        Update: {
          conversation_id?: string
          user_id?: string
          joined_at?: string
          last_read_message_id?: string | null
          role?: 'owner' | 'admin' | 'member'
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string | null
          content: string
          type: 'text' | 'image' | 'file'
          reply_to_id: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id?: string | null
          content: string
          type?: 'text' | 'image' | 'file'
          reply_to_id?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string | null
          content?: string
          type?: 'text' | 'image' | 'file'
          reply_to_id?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          created_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
