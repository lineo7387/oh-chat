import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from './auth'
import { useConversationSettingsStore } from './conversationSettings'
import type { Conversation, ConversationParticipant, Message, Profile, Attachment } from '@/types'

export interface ConversationWithMeta extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[]
  lastMessage?: Pick<Message, 'id' | 'content' | 'created_at' | 'sender_id'>
  unreadCount: number
}

// Supabase query result helpers
interface ConvParticipantRow {
  conversation_id: string
  unread_count: number
  last_read_at: string | null
}

interface LastMessageRow {
  id: string
  conversation_id: string
  content: string
  created_at: string
  sender_id: string | null
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<ConversationWithMeta[]>([])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<Message[]>([])
  const isLoadingConversations = ref(false)
  const isLoadingMessages = ref(false)
  const isLoadingMore = ref(false)
  const hasMoreMessages = ref(true)
  const statusTick = ref(0)
  const settingsStore = useConversationSettingsStore()

  const currentConversation = computed(() => {
    return conversations.value.find((c) => c.id === currentConversationId.value) || null
  })

  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      const aPinned = settingsStore.isPinned(a.id)
      const bPinned = settingsStore.isPinned(b.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      if (aPinned && bPinned) {
        const aTime = settingsStore.getSetting(a.id)?.pinned_at ?? ''
        const bTime = settingsStore.getSetting(b.id)?.pinned_at ?? ''
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      }
      // Neither pinned — sort by last message time, fallback to conversation updated_at
      const aMsgTime = a.lastMessage?.created_at ?? a.updated_at
      const bMsgTime = b.lastMessage?.created_at ?? b.updated_at
      return new Date(bMsgTime).getTime() - new Date(aMsgTime).getTime()
    })
  })

  function getConversationName(conv: ConversationWithMeta): string {
    const customName = settingsStore.getCustomName(conv.id)
    if (customName) return customName
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
    if (!other?.profile?.last_seen) return undefined
    // Access statusTick so Vue re-evaluates when it changes
    void statusTick.value
    const lastSeen = new Date(other.profile.last_seen).getTime()
    return Date.now() - lastSeen < 2 * 60 * 1000 ? 'online' : 'offline'
  }

  async function fetchConversations() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    isLoadingConversations.value = true
    try {
      // 1. Get conversation IDs the user participates in + unread counts
      const { data: myParts, error: partsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, unread_count, last_read_at')
        .eq('user_id', authStore.user.id)
        .returns<ConvParticipantRow[]>()

      if (partsError) throw partsError
      if (!myParts?.length) {
        conversations.value = []
        return
      }

      const ids = myParts.map((p) => p.conversation_id)
      const myPartsMap = new Map(myParts.map((p) => [p.conversation_id, p]))

      // 2. Get conversations with participants and profiles
      const { data: convsData, error: convsError } = await supabase
        .from('conversations')
        .select(
          `*,
          participants:conversation_participants(
            user_id, role, joined_at, last_read_message_id,
            profile:profiles!conversation_participants_user_id_fkey(id, username, display_name, avatar_url, status, email)
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

      // 4. Build enriched conversations (filter out hidden ones after settings load)
      const enrichedConversations = (convsData ?? []).map((conv: Record<string, unknown>) => {
        const rawParticipants = (conv.participants as Array<Record<string, unknown>>) ?? []
        const participants = rawParticipants.map((p) => ({
          conversation_id: conv.id as string,
          user_id: p.user_id as string,
          role: p.role as 'owner' | 'admin' | 'member',
          joined_at: p.joined_at as string,
          last_read_message_id: (p.last_read_message_id as string | null) ?? null,
          unread_count: (p.unread_count as number) ?? 0,
          last_read_at: (p.last_read_at as string | null) ?? null,
          profile: p.profile as Profile,
        }))

        const lastMsg = lastMsgMap.get(conv.id as string)
        const myPart = myPartsMap.get(conv.id as string)

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
          unreadCount: myPart?.unread_count ?? 0,
        }
      })

      // 5. Fetch conversation settings (custom names, pin, mute, hidden)
      await settingsStore.fetchSettings()

      // 6. Filter out hidden conversations
      conversations.value = enrichedConversations.filter((conv) => !settingsStore.isHidden(conv.id))
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      isLoadingConversations.value = false
    }
  }

  function setCurrentConversation(id: string | null) {
    currentConversationId.value = id
  }

  async function markAsRead(conversationId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const conv = conversations.value.find((c) => c.id === conversationId)
    // Skip only if we can confirm it's already read locally
    if (conv && conv.unreadCount === 0) return

    try {
      const { error } = await supabase.rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId,
      })
      if (error) throw error

      // Optimistically update local state if conv exists
      if (conv) {
        conv.unreadCount = 0
        const myParticipant = conv.participants.find((p) => p.user_id === authStore.user?.id)
        if (myParticipant) {
          myParticipant.unread_count = 0
          myParticipant.last_read_at = new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function createDirectConversation(otherUserId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }

    try {
      const { data: convId, error } = await supabase.rpc('create_direct_conversation', {
        p_other_user_id: otherUserId,
      })

      if (error) {
        if (error.message.includes('already exists')) {
          // RPC returns existing id, not error — but handle just in case
          return { success: true as const, conversationId: convId ?? '', isNew: false as const }
        }
        throw error
      }

      if (!convId) {
        return { success: false as const, error: 'Failed to create conversation' }
      }

      // Unhide if this conversation was previously hidden
      if (settingsStore.isHidden(convId)) {
        await settingsStore.toggleHide(convId)
      }

      return { success: true as const, conversationId: convId, isNew: true as const }
    } catch (error) {
      console.error('Failed to create direct conversation:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function createGroupConversation(title: string, memberIds: string[]) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }

    try {
      const { data: convId, error } = await supabase.rpc('create_group_conversation', {
        p_title: title,
        p_member_ids: memberIds,
      })

      if (error) throw error
      if (!convId) {
        return { success: false as const, error: 'Failed to create group' }
      }

      // Unhide if this conversation was previously hidden
      if (settingsStore.isHidden(convId)) {
        await settingsStore.toggleHide(convId)
      }

      return { success: true as const, conversationId: convId }
    } catch (error) {
      console.error('Failed to create group conversation:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function addGroupMembers(conversationId: string, userIds: string[]) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }
    if (userIds.length === 0) return { success: true as const }

    try {
      const rows = userIds.map((uid) => ({
        conversation_id: conversationId,
        user_id: uid,
        role: 'member' as const,
      }))
      const { error } = await supabase.from('conversation_participants').insert(rows)
      if (error) throw error

      // Refresh local participants
      await fetchConversations()
      return { success: true as const }
    } catch (error) {
      console.error('Failed to add group members:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function removeGroupMember(conversationId: string, userId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
      if (error) throw error

      // Refresh local state
      await fetchConversations()
      return { success: true as const }
    } catch (error) {
      console.error('Failed to remove group member:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function updateGroupTitle(conversationId: string, title: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)
      if (error) throw error

      // Update local state
      const conv = conversations.value.find((c) => c.id === conversationId)
      if (conv) conv.title = title
      return { success: true as const }
    } catch (error) {
      console.error('Failed to update group title:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function fetchMessages(conversationId: string, options?: { loadMore?: boolean }) {
    const pageSize = 50
    const clearedAt = settingsStore.getClearedAt(conversationId)

    if (options?.loadMore) {
      isLoadingMore.value = true
    } else {
      isLoadingMessages.value = true
      hasMoreMessages.value = true
    }

    try {
      let query = supabase
        .from('messages')
        .select(
          `*,
          sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url, status),
          attachments(id, message_id, file_name, file_type, file_size, storage_path, created_at)`,
        )
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)

      if (clearedAt) {
        query = query.gt('created_at', clearedAt)
      }

      if (options?.loadMore && messages.value.length > 0) {
        const oldest = messages.value[0]!
        query = query.lt('created_at', oldest.created_at)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(pageSize)

      if (error) throw error

      const fetched = (data ?? []).reverse().map((m: Record<string, unknown>) => ({
        ...(m as unknown as Message),
        sender: (m.sender as Profile) ?? undefined,
        attachments: (m.attachments as Attachment[]) ?? undefined,
      }))

      if (options?.loadMore) {
        messages.value = [...fetched, ...messages.value]
      } else {
        messages.value = fetched
      }

      hasMoreMessages.value = (data ?? []).length === pageSize
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      if (options?.loadMore) {
        isLoadingMore.value = false
      } else {
        isLoadingMessages.value = false
      }
    }
  }

  async function sendMessage(content: string, files?: File[]) {
    const authStore = useAuthStore()
    if (!authStore.user || !currentConversationId.value)
      return { success: false as const, error: 'Not authenticated' }

    try {
      // Determine message type based on files
      let messageType: 'text' | 'image' | 'file' = 'text'
      if (files && files.length > 0) {
        const hasImage = files.some((f) => f.type.startsWith('image/'))
        const hasNonImage = files.some((f) => !f.type.startsWith('image/'))
        if (hasNonImage) messageType = 'file'
        else if (hasImage) messageType = 'image'
      }

      // 1. Create the message
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId.value,
          sender_id: authStore.user.id,
          content,
          type: messageType,
        })
        .select()
        .single()

      if (msgError || !messageData) throw msgError ?? new Error('Failed to create message')
      const messageId = messageData.id as string

      // Optimistically add message to current conversation
      if (currentConversationId.value) {
        messages.value.push({
          ...(messageData as unknown as Message),
          sender: authStore.profile as Profile,
          attachments: [],
        })
      }

      // 2. Upload files and create attachment records
      if (files && files.length > 0) {
        for (const file of files) {
          const filePath = `${currentConversationId.value}/${messageId}/${file.name}`

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Failed to upload file:', uploadError)
            continue
          }

          const { error: attachError } = await supabase.from('attachments').insert({
            message_id: messageId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
          })

          if (attachError) {
            console.error('Failed to create attachment record:', attachError)
          }
        }
      }

      return { success: true as const }
    } catch (error) {
      console.error('Failed to send message:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ── Realtime ───────────────────────────────────────────────

  let _messageChannel: ReturnType<typeof supabase.channel> | null = null
  let _participantsChannel: ReturnType<typeof supabase.channel> | null = null
  let _profilesChannel: ReturnType<typeof supabase.channel> | null = null
  let _statusTickInterval: ReturnType<typeof setInterval> | null = null

  function handleIncomingMessage(msg: Record<string, unknown>) {
    const authStore = useAuthStore()
    const convId = msg.conversation_id as string
    const senderId = msg.sender_id as string | null

    // Add to current conversation messages (skip if already present from optimistic update)
    if (convId === currentConversationId.value) {
      const alreadyExists = messages.value.some((m) => m.id === (msg.id as string))
      if (!alreadyExists) {
        const conv = conversations.value.find((c) => c.id === convId)
        const sender = conv?.participants.find((p) => p.user_id === senderId)?.profile
        messages.value.push({
          ...(msg as unknown as Message),
          sender: sender
            ? sender
            : senderId === authStore.user?.id
              ? (authStore.profile as Profile)
              : undefined,
          attachments: [],
        })
      }
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
    } else {
      // New conversation not yet in list — if hidden, unhide so it reappears
      if (settingsStore.isHidden(convId)) {
        settingsStore.upsertSetting(convId, { is_hidden: false }).then(() => fetchConversations())
      } else {
        fetchConversations()
      }
    }
  }

  function handleParticipantUpdate(payload: Record<string, unknown>) {
    const authStore = useAuthStore()
    const newData = payload.new as Record<string, unknown> | undefined
    if (!newData) return

    const convId = newData.conversation_id as string
    const userId = newData.user_id as string
    if (userId !== authStore.user?.id) return

    const conv = conversations.value.find((c) => c.id === convId)
    if (!conv) return

    const unreadCount = newData.unread_count as number

    // For the currently viewed conversation, only accept decreases in unread count.
    // This prevents stale Realtime events (from messages that arrived before we opened
    // the conversation) from overwriting our optimistic mark-as-read update.
    if (convId === currentConversationId.value && unreadCount >= conv.unreadCount) {
      return
    }

    conv.unreadCount = unreadCount

    const myParticipant = conv.participants.find((p) => p.user_id === userId)
    if (myParticipant) {
      myParticipant.unread_count = unreadCount
      myParticipant.last_read_at =
        (newData.last_read_at as string | null) ?? myParticipant.last_read_at
    }
  }

  function handleParticipantInsert(payload: Record<string, unknown>) {
    const authStore = useAuthStore()
    const newData = payload.new as Record<string, unknown> | undefined
    if (!newData) return

    const userId = newData.user_id as string
    if (userId !== authStore.user?.id) return

    const convId = newData.conversation_id as string

    // Avoid duplicate fetch if conversation already exists locally
    const alreadyExists = conversations.value.some((c) => c.id === convId)
    if (alreadyExists) return

    fetchConversations()
  }

  function handleProfileUpdate(payload: Record<string, unknown>) {
    const authStore = useAuthStore()
    const newData = payload.new as Record<string, unknown> | undefined
    if (!newData) return

    const updatedProfile = newData as unknown as Profile

    // Update current user's own profile
    if (updatedProfile.id === authStore.user?.id && authStore.profile) {
      authStore.profile = { ...authStore.profile, ...updatedProfile }
    }

    // Update in all conversations' participants
    for (const conv of conversations.value) {
      for (const p of conv.participants) {
        if (p.user_id === updatedProfile.id && p.profile) {
          p.profile = { ...p.profile, ...updatedProfile }
        }
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

    // Also subscribe to conversation_participants for unread_count updates
    // and new participant insertions (when user is invited to a group)
    if (!_participantsChannel) {
      _participantsChannel = supabase
        .channel('conversation_participants')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_participants',
          },
          (payload) => {
            handleParticipantUpdate(payload as Record<string, unknown>)
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_participants',
          },
          (payload) => {
            handleParticipantInsert(payload as Record<string, unknown>)
          },
        )
        .subscribe()
    }

    // Subscribe to profiles for online status updates
    if (!_profilesChannel) {
      _profilesChannel = supabase
        .channel('profiles')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            handleProfileUpdate(payload as Record<string, unknown>)
          },
        )
        .subscribe()
    }

    // Start status tick to refresh online/offline inference every 30s
    if (!_statusTickInterval) {
      _statusTickInterval = setInterval(() => {
        statusTick.value++
      }, 30000)
    }
  }

  function unsubscribeFromMessages() {
    _messageChannel?.unsubscribe()
    _messageChannel = null
    _participantsChannel?.unsubscribe()
    _participantsChannel = null
    _profilesChannel?.unsubscribe()
    _profilesChannel = null
    if (_statusTickInterval) {
      clearInterval(_statusTickInterval)
      _statusTickInterval = null
    }
  }

  function getAttachmentUrl(storagePath: string): string {
    const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath)
    return data.publicUrl
  }

  return {
    conversations,
    sortedConversations,
    currentConversationId,
    currentConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    statusTick,
    fetchConversations,
    setCurrentConversation,
    createDirectConversation,
    createGroupConversation,
    addGroupMembers,
    removeGroupMember,
    updateGroupTitle,
    fetchMessages,
    sendMessage,
    getConversationName,
    getConversationAvatar,
    getConversationStatus,
    getAttachmentUrl,
    subscribeToMessages,
    unsubscribeFromMessages,
    markAsRead,
  }
})
