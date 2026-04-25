import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from './auth'
import type { ConversationSettings } from '@/types'

export const useConversationSettingsStore = defineStore('conversationSettings', () => {
  const settingsMap = ref<Map<string, ConversationSettings>>(new Map())
  const isLoading = ref(false)

  function getSetting(conversationId: string): ConversationSettings | undefined {
    return settingsMap.value.get(conversationId)
  }

  function isPinned(conversationId: string): boolean {
    return getSetting(conversationId)?.is_pinned ?? false
  }

  function isMuted(conversationId: string): boolean {
    return getSetting(conversationId)?.is_muted ?? false
  }

  function getCustomName(conversationId: string): string | null {
    return getSetting(conversationId)?.custom_name ?? null
  }

  async function fetchSettings() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('conversation_settings')
        .select('user_id, conversation_id, custom_name, is_muted, is_pinned, pinned_at, updated_at')
        .eq('user_id', authStore.user.id)

      if (error) throw error

      const map = new Map<string, ConversationSettings>()
      for (const row of (data ?? []) as unknown as ConversationSettings[]) {
        map.set(row.conversation_id, row)
      }
      settingsMap.value = map
    } catch (error) {
      console.error('Failed to fetch conversation settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function upsertSetting(
    conversationId: string,
    partial: Partial<Omit<ConversationSettings, 'user_id' | 'conversation_id' | 'updated_at'>>,
  ) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false as const, error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('conversation_settings')
        .upsert(
          {
            user_id: authStore.user.id,
            conversation_id: conversationId,
            ...partial,
          },
          { onConflict: 'user_id,conversation_id' },
        )
        .select()
        .single()

      if (error) throw error

      // Optimistically update local state
      if (data) {
        const setting = data as unknown as ConversationSettings
        settingsMap.value.set(conversationId, setting)
        // Trigger reactivity by creating a new Map reference
        settingsMap.value = new Map(settingsMap.value)
      }

      return { success: true as const }
    } catch (error) {
      console.error('Failed to upsert conversation setting:', error)
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async function togglePin(conversationId: string) {
    const currentlyPinned = isPinned(conversationId)
    return upsertSetting(conversationId, {
      is_pinned: !currentlyPinned,
      pinned_at: !currentlyPinned ? new Date().toISOString() : null,
    })
  }

  async function toggleMute(conversationId: string) {
    const currentlyMuted = isMuted(conversationId)
    return upsertSetting(conversationId, {
      is_muted: !currentlyMuted,
    })
  }

  async function setCustomName(conversationId: string, customName: string | null) {
    return upsertSetting(conversationId, {
      custom_name: customName?.trim() || null,
    })
  }

  return {
    settingsMap,
    isLoading,
    getSetting,
    isPinned,
    isMuted,
    getCustomName,
    fetchSettings,
    upsertSetting,
    togglePin,
    toggleMute,
    setCustomName,
  }
})
