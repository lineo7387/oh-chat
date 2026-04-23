import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from './auth'
import type { Conversation, ConversationParticipant, Message, Profile } from '@/types'

export interface ConversationWithMeta extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[]
  lastMessage?: Pick<Message, 'id' | 'content' | 'created_at' | 'sender_id'>
  unreadCount: number
}

// Supabase query result helpers
interface ConvParticipantRow {
  conversation_id: string
}

interface LastMessageRow {
  id: string
  conversation_id: string
  content: string
  created_at: string
  sender_id: string | null
}

interface ConversationInsertResult {
  id: string
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<ConversationWithMeta[]>([])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)

  const currentConversation = computed(() => {
    return conversations.value.find((c) => c.id === currentConversationId.value) || null
  })

  function getConversationName(conv: ConversationWithMeta): string {
    if (conv.type === 'group') {
      return conv.title ?? 'Unnamed Group'
    }
    const authStore = useAuthStore()
    const other = conv.participants.find((p) => p.user_id !== authStore.user?.id)
    return other?.profile?.display_name ?? other?.profile?.username ?? 'Unknown'
  }

  function getConversationAvatar(conv: ConversationWithMeta): string | undefined {
    if (conv.avatar_url) return conv.avatar_url
    if (conv.type === 'direct') {
      const authStore = useAuthStore()
      const other = conv.participants.find((p) => p.user_id !== authStore.user?.id)
      return other?.profile?.avatar_url ?? undefined
    }
    return undefined
  }

  function getConversationStatus(conv: ConversationWithMeta): Profile['status'] | undefined {
    if (conv.type !== 'direct') return undefined
    const authStore = useAuthStore()
    const other = conv.participants.find((p) => p.user_id !== authStore.user?.id)
    return other?.profile?.status
  }

  async function fetchConversations() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    isLoading.value = true
    try {
      // 1. Get conversation IDs the user participates in
      const { data: myParts, error: partsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', authStore.user.id)
        .returns<ConvParticipantRow[]>()

      if (partsError) throw partsError
      if (!myParts?.length) {
        conversations.value = []
        return
      }

      const ids = myParts.map((p) => p.conversation_id)

      // 2. Get conversations with participants and profiles
      const { data: convsData, error: convsError } = await supabase
        .from('conversations')
        .select(
          `*,
          participants:conversation_participants(
            user_id, role, joined_at, last_read_message_id,
            profile:profiles(id, username, display_name, avatar_url, status)
          )`,
        )
        .in('id', ids)
        .order('updated_at', { ascending: false })

      if (convsError) throw convsError

      // 3. Get last message for each conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at, sender_id')
        .in('conversation_id', ids)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .returns<LastMessageRow[]>()

      if (msgError) throw msgError

      // Build a map of last message per conversation (first = latest due to ordering)
      const lastMsgMap = new Map<string, LastMessageRow>()
      for (const msg of lastMessages ?? []) {
        if (!lastMsgMap.has(msg.conversation_id)) {
          lastMsgMap.set(msg.conversation_id, msg)
        }
      }

      // 4. Build enriched conversations
      conversations.value = (convsData ?? []).map((conv: Record<string, unknown>) => {
        const rawParticipants = (conv.participants as Array<Record<string, unknown>>) ?? []
        const participants = rawParticipants.map((p) => ({
          conversation_id: conv.id as string,
          user_id: p.user_id as string,
          role: p.role as 'owner' | 'admin' | 'member',
          joined_at: p.joined_at as string,
          last_read_message_id: (p.last_read_message_id as string | null) ?? null,
          profile: p.profile as Profile,
        }))

        const lastMsg = lastMsgMap.get(conv.id as string)

        return {
          ...(conv as unknown as Conversation),
          participants,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                content: lastMsg.content,
                created_at: lastMsg.created_at,
                sender_id: lastMsg.sender_id,
              }
            : undefined,
          unreadCount: 0,
        }
      })
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentConversation(id: string | null) {
    currentConversationId.value = id
  }

  async function createDirectConversation(otherUserId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }

    // Check if a direct conversation already exists between these two users
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', authStore.user.id)
      .returns<ConvParticipantRow[]>()

    if (existing?.length) {
      const myConvIds = existing.map((e) => e.conversation_id)
      const { data: mutual } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds)
        .returns<ConvParticipantRow[]>()

      if (mutual?.length) {
        const mutualIds = mutual.map((m) => m.conversation_id)
        const { data: directConvs } = await supabase
          .from('conversations')
          .select('id')
          .in('id', mutualIds)
          .eq('type', 'direct')
          .returns<ConversationInsertResult[]>()

        if (directConvs?.length && directConvs[0]) {
          return {
            success: true as const,
            conversationId: directConvs[0].id,
            isNew: false as const,
          }
        }
      }
    }

    // Create new direct conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: authStore.user.id })
      .select()
      .single()
      .returns<ConversationInsertResult>()

    if (convError || !newConv) {
      return {
        success: false as const,
        error: convError?.message ?? 'Failed to create conversation',
      }
    }

    // Add both participants
    const { error: partError } = await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: authStore.user.id, role: 'owner' },
      { conversation_id: newConv.id, user_id: otherUserId, role: 'member' },
    ])

    if (partError) {
      return { success: false as const, error: partError.message }
    }

    return { success: true as const, conversationId: newConv.id, isNew: true as const }
  }

  async function fetchMessages(conversationId: string) {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `*,
          sender:profiles(id, username, display_name, avatar_url, status)`,
        )
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      messages.value = (data ?? []).map((m: Record<string, unknown>) => ({
        ...(m as unknown as Message),
        sender: (m.sender as Profile) ?? undefined,
      }))
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function sendMessage(content: string) {
    const authStore = useAuthStore()
    if (!authStore.user || !currentConversationId.value) return { success: false as const }

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: currentConversationId.value,
        sender_id: authStore.user.id,
        content,
        type: 'text',
      })

      if (error) throw error
      return { success: true as const }
    } catch (error) {
      console.error('Failed to send message:', error)
      return { success: false as const }
    }
  }

  // ── Realtime ───────────────────────────────────────────────

  let _messageChannel: ReturnType<typeof supabase.channel> | null = null

  function handleIncomingMessage(msg: Record<string, unknown>) {
    const authStore = useAuthStore()
    const convId = msg.conversation_id as string
    const senderId = msg.sender_id as string | null

    // Add to current conversation messages
    if (convId === currentConversationId.value) {
      const conv = conversations.value.find((c) => c.id === convId)
      const sender = conv?.participants.find((p) => p.user_id === senderId)?.profile
      messages.value.push({
        ...(msg as unknown as Message),
        sender: sender
          ? sender
          : senderId === authStore.user?.id
            ? (authStore.profile as Profile)
            : undefined,
      })
    }

    // Update conversation list preview
    const conv = conversations.value.find((c) => c.id === convId)
    if (conv) {
      conv.lastMessage = {
        id: msg.id as string,
        content: msg.content as string,
        created_at: msg.created_at as string,
        sender_id: senderId,
      }
      // Bubble to top
      const idx = conversations.value.indexOf(conv)
      if (idx > 0) {
        conversations.value.splice(idx, 1)
        conversations.value.unshift(conv)
      }
      // Increment unread if not current conversation
      if (convId !== currentConversationId.value && senderId !== authStore.user?.id) {
        conv.unreadCount++
      }
    }
  }

  function subscribeToMessages() {
    if (_messageChannel) return

    _messageChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          handleIncomingMessage(payload.new as Record<string, unknown>)
        },
      )
      .subscribe()
  }

  function unsubscribeFromMessages() {
    _messageChannel?.unsubscribe()
    _messageChannel = null
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    isLoading,
    fetchConversations,
    setCurrentConversation,
    createDirectConversation,
    fetchMessages,
    sendMessage,
    getConversationName,
    getConversationAvatar,
    getConversationStatus,
    subscribeToMessages,
    unsubscribeFromMessages,
  }
})
