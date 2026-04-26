<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useFriendStore } from '@/stores/friend'
import Sidebar from '@/components/layout/Sidebar.vue'

const authStore = useAuthStore()
const chatStore = useChatStore()
const friendStore = useFriendStore()

const route = useRoute()
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')

const showSidebar = computed(() => !isMobile.value || route.path === '/')
const showMain = computed(() => !isMobile.value || route.path !== '/')

onMounted(async () => {
  if (!authStore.user) {
    await authStore.init()
  }
  await chatStore.fetchConversations()
  chatStore.subscribeToMessages()
  friendStore.fetchFriends()
  friendStore.fetchPendingRequests()
  friendStore.subscribeToFriends()
})

onUnmounted(() => {
  chatStore.unsubscribeFromMessages()
  friendStore.unsubscribeFromFriends()
})
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-background">
    <Sidebar v-if="showSidebar" />

    <main v-if="showMain" class="relative flex flex-1 flex-col overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
