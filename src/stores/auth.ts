import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const isAuthenticated = computed(() => !!user.value)

  async function init() {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      user.value = {
        id: data.session.user.id,
        email: data.session.user.email!,
      }
      await fetchProfile()
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        user.value = { id: session.user.id, email: session.user.email! }
        fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
      }
    })
  }

  async function signUp(email: string, password: string, username: string) {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error }
    } finally {
      isLoading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      user.value = { id: data.user.id, email: data.user.email! }
      await fetchProfile()
      return { success: true, data }
    } catch (error) {
      return { success: false, error }
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    isLoading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
      return { success: true }
    } catch (error) {
      return { success: false, error }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.value.id).single()
    if (data) {
      profile.value = data as Profile
    }
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    init,
    signUp,
    signIn,
    signOut,
    fetchProfile,
  }
})
