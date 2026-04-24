import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from './auth'
import type { Friend, Profile, FriendStatus } from '@/types'

export interface FriendWithProfile extends Friend {
  // The other person's profile (not the current user)
  otherProfile: Profile
}

export const useFriendStore = defineStore('friend', () => {
  const authStore = useAuthStore()

  const friends = ref<FriendWithProfile[]>([])
  const pendingRequests = ref<FriendWithProfile[]>([])
  const sentRequests = ref<FriendWithProfile[]>([])
  const isLoading = ref(false)

  const pendingCount = computed(() => pendingRequests.value.length)

  function extractOtherProfile(row: Record<string, unknown>): Profile {
    const authId = authStore.user?.id
    const sender = row.sender as Profile
    const receiver = row.receiver as Profile
    return sender.id === authId ? receiver : sender
  }

  async function fetchFriends() {
    const authId = authStore.user?.id
    if (!authId) return

    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(
          `id, sender_id, receiver_id, status, created_at, updated_at,
          sender:profiles!friends_sender_id_fkey(id, username, display_name, avatar_url, status),
          receiver:profiles!friends_receiver_id_fkey(id, username, display_name, avatar_url, status)`,
        )
        .eq('status', 'accepted')
        .or(`sender_id.eq.${authId},receiver_id.eq.${authId}`)

      if (error) throw error

      friends.value = (data ?? []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as Friend),
        sender: (row.sender as Profile) ?? undefined,
        receiver: (row.receiver as Profile) ?? undefined,
        otherProfile: extractOtherProfile(row),
      }))
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPendingRequests() {
    const authId = authStore.user?.id
    if (!authId) return

    try {
      // Requests received by current user
      const { data: received, error: err1 } = await supabase
        .from('friends')
        .select(
          `id, sender_id, receiver_id, status, created_at, updated_at,
          sender:profiles!friends_sender_id_fkey(id, username, display_name, avatar_url, status)`,
        )
        .eq('status', 'pending')
        .eq('receiver_id', authId)

      if (err1) throw err1

      pendingRequests.value = (received ?? []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as Friend),
        sender: (row.sender as Profile) ?? undefined,
        otherProfile: (row.sender as Profile) as Profile,
      }))

      // Requests sent by current user
      const { data: sent, error: err2 } = await supabase
        .from('friends')
        .select(
          `id, sender_id, receiver_id, status, created_at, updated_at,
          receiver:profiles!friends_receiver_id_fkey(id, username, display_name, avatar_url, status)`,
        )
        .eq('status', 'pending')
        .eq('sender_id', authId)

      if (err2) throw err2

      sentRequests.value = (sent ?? []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as Friend),
        receiver: (row.receiver as Profile) ?? undefined,
        otherProfile: (row.receiver as Profile) as Profile,
      }))
    } catch (error) {
      console.error('Failed to fetch pending requests:', error)
    }
  }

  async function sendFriendRequest(receiverId: string) {
    const authId = authStore.user?.id
    if (!authId) return { success: false as const, error: 'Not authenticated' }
    if (authId === receiverId) return { success: false as const, error: 'Cannot add yourself' }

    try {
      const { error } = await supabase.from('friends').insert({
        sender_id: authId,
        receiver_id: receiverId,
        status: 'pending',
      })

      if (error) {
        if (error.message.includes('duplicate')) {
          return { success: false as const, error: 'Friend request already exists' }
        }
        throw error
      }

      await fetchPendingRequests()
      return { success: true as const }
    } catch (error) {
      console.error('Failed to send friend request:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function acceptFriendRequest(friendId: string) {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendId)

      if (error) throw error

      await fetchPendingRequests()
      await fetchFriends()
      return { success: true as const }
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function rejectFriendRequest(friendId: string) {
    try {
      const { error } = await supabase.from('friends').delete().eq('id', friendId)

      if (error) throw error

      await fetchPendingRequests()
      return { success: true as const }
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function removeFriend(friendId: string) {
    try {
      const { error } = await supabase.from('friends').delete().eq('id', friendId)

      if (error) throw error

      await fetchFriends()
      return { success: true as const }
    } catch (error) {
      console.error('Failed to remove friend:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function getFriendshipStatus(userId: string): Promise<FriendStatus | null> {
    const authId = authStore.user?.id
    if (!authId) return null

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('status')
        .or(
          `and(sender_id.eq.${authId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${authId})`,
        )
        .maybeSingle()

      if (error) throw error
      return (data?.status as FriendStatus) ?? null
    } catch (error) {
      console.error('Failed to get friendship status:', error)
      return null
    }
  }

  // ── Realtime ───────────────────────────────────────────────

  let _friendChannel: ReturnType<typeof supabase.channel> | null = null

  function handleFriendChange(payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) {
    const authId = authStore.user?.id
    if (!authId) return

    const newRow = payload.new
    const senderId = newRow.sender_id as string
    const receiverId = newRow.receiver_id as string
    const status = newRow.status as FriendStatus

    // Only care about records involving current user
    if (senderId !== authId && receiverId !== authId) return

    if (payload.eventType === 'INSERT') {
      if (status === 'pending') {
        fetchPendingRequests()
      } else if (status === 'accepted') {
        fetchFriends()
      }
    } else if (payload.eventType === 'UPDATE') {
      if (status === 'accepted') {
        fetchPendingRequests()
        fetchFriends()
      }
    } else if (payload.eventType === 'DELETE') {
      fetchPendingRequests()
      fetchFriends()
    }
  }

  function subscribeToFriends() {
    if (_friendChannel) return

    _friendChannel = supabase
      .channel('friends')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
        },
        (payload) => {
          handleFriendChange(payload as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> })
        },
      )
      .subscribe()
  }

  function unsubscribeFromFriends() {
    _friendChannel?.unsubscribe()
    _friendChannel = null
  }

  return {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    pendingCount,
    fetchFriends,
    fetchPendingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriendshipStatus,
    subscribeToFriends,
    unsubscribeFromFriends,
  }
})
