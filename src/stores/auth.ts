import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const authError = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  let _authSubscription: { unsubscribe: () => void } | null = null

  async function init() {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      user.value = {
        id: data.session.user.id,
        email: data.session.user.email!,
      }
      await fetchProfile()
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        user.value = { id: session.user.id, email: session.user.email! }
        fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
      } else if (event === 'USER_UPDATED' && session) {
        user.value = { id: session.user.id, email: session.user.email! }
      }
    })
    _authSubscription = authListener.subscription
  }

  function cleanup() {
    _authSubscription?.unsubscribe()
    _authSubscription = null
  }

  function clearError() {
    authError.value = null
  }

  function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message
    }
    return 'An unexpected error occurred'
  }

  async function signUp(email: string, password: string, username: string) {
    isLoading.value = true
    authError.value = null
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
        },
      })
      if (error) throw error

      // If email confirmation is required, session will be null
      if (!data.session) {
        return { success: true as const, needsEmailConfirmation: true as const }
      }

      user.value = { id: data.user!.id, email: data.user!.email! }
      await fetchProfile()
      return { success: true as const, needsEmailConfirmation: false as const }
    } catch (error) {
      authError.value = getErrorMessage(error)
      return { success: false as const, needsEmailConfirmation: false as const }
    } finally {
      isLoading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    isLoading.value = true
    authError.value = null
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      user.value = { id: data.user.id, email: data.user.email! }
      await fetchProfile()
      return { success: true as const }
    } catch (error) {
      authError.value = getErrorMessage(error)
      return { success: false as const }
    } finally {
      isLoading.value = false
    }
  }

  async function signInWithOAuth(provider: 'google' | 'github') {
    isLoading.value = true
    authError.value = null
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
      // Redirect happens externally; success is determined on callback
      return { success: true as const }
    } catch (error) {
      authError.value = getErrorMessage(error)
      return { success: false as const }
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    isLoading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      user.value = null
      profile.value = null
      return { success: true as const }
    } catch (error) {
      authError.value = getErrorMessage(error)
      return { success: false as const }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (data && !error) {
      profile.value = data as Profile
    }
  }

  async function updateProfile(
    updates: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url'>>,
  ) {
    if (!user.value) return { success: false as const, error: 'Not authenticated' }
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.value.id)
      if (error) throw error
      await fetchProfile()
      return { success: true as const }
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }
    }
  }

  async function uploadAvatar(file: File) {
    if (!user.value) return { success: false as const, error: 'Not authenticated' }

    if (!file.type.startsWith('image/')) {
      return { success: false as const, error: 'Please select an image file' }
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false as const, error: 'Image must be under 2MB' }
    }

    const ext = file.name.split('.').pop() || 'png'
    const filePath = `avatars/${user.value.id}/${Date.now()}.${ext}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath)
      return await updateProfile({ avatar_url: urlData.publicUrl })
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Failed to upload avatar',
      }
    }
  }

  return {
    user,
    profile,
    isLoading,
    authError,
    isAuthenticated,
    init,
    cleanup,
    clearError,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    fetchProfile,
    updateProfile,
    uploadAvatar,
  }
})
