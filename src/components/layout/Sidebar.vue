<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhMagnifyingGlass,
  PhPlus,
  PhGear,
  PhX,
  PhChatCircle,
  PhUsers,
  PhPushPin,
  PhBellSlash,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useFriendStore } from '@/stores/friend'
import { useConversationSettingsStore } from '@/stores/conversationSettings'
import Avatar from '@/components/ui/Avatar.vue'
import SwipeableItem from '@/components/ui/SwipeableItem.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const chatStore = useChatStore()
const friendStore = useFriendStore()
const settingsStore = useConversationSettingsStore()
const router = useRouter()
const activeSwipeId = ref<string | null>(null)

function close() {
  emit('close')
}

function onSwipeOpen(convId: string) {
  activeSwipeId.value = convId
}

async function handlePin(convId: string) {
  await settingsStore.togglePin(convId)
}

async function handleDelete(convId: string) {
  await settingsStore.hideAndClear(convId)
  await chatStore.fetchConversations()
  // If currently viewing this conversation, navigate away
  if (chatStore.currentConversationId === convId) {
    router.push('/')
  }
}

const displayName = computed(() => {
  return authStore.profile?.display_name || authStore.profile?.username || 'Guest User'
})

const statusText = computed(() => {
  // Depend on statusTick so this re-evaluates when it changes
  void chatStore.statusTick
  if (!authStore.profile?.last_seen) return 'offline'
  const lastSeen = new Date(authStore.profile.last_seen).getTime()
  return Date.now() - lastSeen < 2 * 60 * 1000 ? 'online' : 'offline'
})

// Fetch conversations when authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    chatStore.fetchConversations()
  }
})

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) chatStore.fetchConversations()
    else chatStore.conversations = []
  },
)

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function truncatePreview(text: string | undefined, max = 40): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
    @click="close"
  />

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed z-50 flex h-full w-72 flex-col border-r border-border/30 bg-card/80 backdrop-blur-md transition-transform duration-300 ease-organic md:relative md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- User avatar header -->
    <div class="flex items-center gap-3 border-b border-border/30 p-4">
      <Avatar
        :src="authStore.profile?.avatar_url"
        :alt="displayName"
        size="md"
        :status="authStore.profile?.status"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate font-heading text-sm font-semibold text-foreground">{{ displayName }}</p>
        <p class="text-xs capitalize text-muted-foreground">{{ statusText }}</p>
      </div>
      <button
        class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted md:hidden"
        @click="close"
      >
        <PhX :size="18" />
      </button>
    </div>

    <!-- Search -->
    <div class="p-3">
      <div class="relative">
        <PhMagnifyingGlass
          :size="18"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search conversations..."
          class="h-10 w-full rounded-full border border-border bg-white/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>

    <!-- Conversation list -->
    <div class="flex-1 overflow-y-auto px-2">
      <!-- Loading -->
      <div v-if="chatStore.isLoadingConversations" class="space-y-2 py-2">
        <div
          v-for="i in 4"
          :key="i"
          class="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-2.5"
        >
          <div class="h-10 w-10 shrink-0 rounded-full bg-muted" />
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="h-3 w-24 rounded bg-muted" />
            <div class="h-2.5 w-32 rounded bg-muted/60" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="chatStore.sortedConversations.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <PhChatCircle :size="32" class="mb-3 text-muted-foreground/40" />
        <p class="text-sm text-muted-foreground">No conversations yet</p>
        <p class="mt-1 text-xs text-muted-foreground/60">Start a new chat to begin</p>
      </div>

      <!-- Conversations -->
      <div v-else class="space-y-0.5 py-2">
        <SwipeableItem
          v-for="conv in chatStore.sortedConversations"
          :key="conv.id"
          :item-id="conv.id"
          :active-id="activeSwipeId"
          :is-pinned="settingsStore.isPinned(conv.id)"
          @open="onSwipeOpen(conv.id)"
          @pin="handlePin(conv.id)"
          @delete="handleDelete(conv.id)"
        >
          <RouterLink
            :to="`/chat/${conv.id}`"
            :class="[
              'flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200',
              chatStore.currentConversationId === conv.id
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-muted',
            ]"
            @click="close()"
          >
            <Avatar
              :src="chatStore.getConversationAvatar(conv)"
              :alt="chatStore.getConversationName(conv)"
              size="sm"
              :status="chatStore.getConversationStatus(conv)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <div class="flex min-w-0 items-center gap-1.5">
                  <PhPushPin
                    v-if="settingsStore.isPinned(conv.id)"
                    :size="12"
                    weight="fill"
                    class="shrink-0 text-secondary"
                  />
                  <p
                    :class="[
                      'truncate text-sm',
                      conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium',
                    ]"
                  >
                    {{ chatStore.getConversationName(conv) }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <PhBellSlash
                    v-if="settingsStore.isMuted(conv.id)"
                    :size="12"
                    class="text-muted-foreground/60"
                  />
                  <span v-if="conv.lastMessage" class="text-[10px] text-muted-foreground">
                    {{ formatTime(conv.lastMessage.created_at) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <p
                  :class="[
                    'truncate text-xs',
                    conv.unreadCount > 0
                      ? 'font-medium text-foreground/80'
                      : 'text-muted-foreground',
                  ]"
                >
                  {{ truncatePreview(conv.lastMessage?.content) }}
                </p>
                <span
                  v-if="conv.unreadCount > 0"
                  class="flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground"
                >
                  {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                </span>
              </div>
            </div>
          </RouterLink>
        </SwipeableItem>
      </div>
    </div>

    <!-- Bottom actions -->
    <div class="flex items-center gap-2 border-t border-border/30 p-3">
      <RouterLink
        to="/new-conversation"
        class="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:scale-105 hover:shadow-hover active:scale-95"
        @click="close"
      >
        <PhPlus :size="18" weight="bold" />
        <span>New Chat</span>
      </RouterLink>
      <RouterLink
        to="/contacts"
        class="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/50 text-foreground transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95"
        @click="close"
      >
        <PhUsers :size="18" />
        <span
          v-if="friendStore.pendingCount > 0"
          class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white"
        >
          {{ friendStore.pendingCount }}
        </span>
      </RouterLink>
      <RouterLink
        to="/settings"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/50 text-foreground transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95"
        @click="close"
      >
        <PhGear :size="18" />
      </RouterLink>
    </div>
  </aside>
</template>
