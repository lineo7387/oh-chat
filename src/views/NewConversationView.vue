<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhMagnifyingGlass,
  PhArrowLeft,
  PhChatCircleText,
  PhUser,
  PhSpinner,
  PhUserPlus,
  PhUsers,
  PhX,
  PhCheck,
} from '@phosphor-icons/vue'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useFriendStore } from '@/stores/friend'
import Avatar from '@/components/ui/Avatar.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

interface SearchResultUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  status: 'online' | 'offline' | 'away'
}

type CreateMode = 'direct' | 'group'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const friendStore = useFriendStore()

const mode = ref<CreateMode>('direct')
const searchQuery = ref('')
const searchResults = ref<SearchResultUser[]>([])
const isSearching = ref(false)
const isCreating = ref(false)
const createError = ref('')
const addingFriendId = ref<string | null>(null)
const addFriendError = ref('')

// Group mode state
const groupTitle = ref('')
const selectedUserIds = ref<Set<string>>(new Set())

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (q) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!q.trim()) {
    searchResults.value = []
    return
  }
  searchTimeout = setTimeout(() => performSearch(q.trim()), 300)
})

// Clear selection when switching mode
watch(mode, () => {
  selectedUserIds.value.clear()
  groupTitle.value = ''
  createError.value = ''
  searchQuery.value = ''
  searchResults.value = []
})

async function performSearch(query: string) {
  isSearching.value = true
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, status')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', authStore.user?.id ?? '')
    .limit(20)

  if (!error) {
    searchResults.value = (data ?? []) as SearchResultUser[]
  }
  isSearching.value = false
}

async function startConversation(userId: string) {
  isCreating.value = true
  createError.value = ''

  const result = await chatStore.createDirectConversation(userId)

  if (result.success) {
    await chatStore.fetchConversations()
    router.push(`/chat/${result.conversationId}`)
  } else {
    createError.value = result.error ?? 'Failed to create conversation'
  }

  isCreating.value = false
}

async function createGroup() {
  if (!groupTitle.value.trim() || selectedUserIds.value.size < 1) return

  isCreating.value = true
  createError.value = ''

  const memberIds = Array.from(selectedUserIds.value)
  const result = await chatStore.createGroupConversation(groupTitle.value.trim(), memberIds)

  if (result.success) {
    await chatStore.fetchConversations()
    router.push(`/chat/${result.conversationId}`)
  } else {
    createError.value = result.error ?? 'Failed to create group'
  }

  isCreating.value = false
}

function toggleUserSelection(userId: string) {
  if (selectedUserIds.value.has(userId)) {
    selectedUserIds.value.delete(userId)
  } else {
    selectedUserIds.value.add(userId)
  }
}

function removeSelectedUser(userId: string) {
  selectedUserIds.value.delete(userId)
}

const selectedUsers = computed(() => {
  return searchResults.value.filter((u) => selectedUserIds.value.has(u.id))
})

const canCreateGroup = computed(() => {
  return groupTitle.value.trim().length > 0 && selectedUserIds.value.size >= 1
})

async function sendFriendRequest(userId: string) {
  addingFriendId.value = userId
  addFriendError.value = ''
  const result = await friendStore.sendFriendRequest(userId)
  addingFriendId.value = null
  if (!result.success) {
    addFriendError.value = result.error ?? 'Failed to send request'
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border/30 px-4 py-3">
      <RouterLink
        to="/"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
      >
        <PhArrowLeft :size="22" class="text-foreground" />
      </RouterLink>
      <h1 class="font-heading text-lg font-semibold text-foreground">New Conversation</h1>
    </div>

    <!-- Mode Tabs -->
    <div class="flex gap-1 border-b border-border/30 px-6 py-3">
      <button
        :class="[
          'flex-1 rounded-full py-2 text-sm font-semibold transition-all duration-200',
          mode === 'direct'
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="mode = 'direct'"
      >
        Direct
      </button>
      <button
        :class="[
          'flex-1 rounded-full py-2 text-sm font-semibold transition-all duration-200',
          mode === 'group'
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="mode = 'group'"
      >
        Group
      </button>
    </div>

    <!-- Group Title (group mode only) -->
    <div v-if="mode === 'group'" class="px-6 pt-4">
      <Input v-model="groupTitle" placeholder="Group name">
        <template #prefix>
          <PhUsers :size="18" class="text-muted-foreground" />
        </template>
      </Input>
    </div>

    <!-- Selected Users Chips (group mode only) -->
    <div v-if="mode === 'group' && selectedUsers.length > 0" class="px-6 pt-3">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="user in selectedUsers"
          :key="user.id"
          class="flex items-center gap-1.5 rounded-full border border-border bg-white/60 px-3 py-1 text-sm"
        >
          <Avatar :src="user.avatar_url" :alt="user.display_name ?? user.username" size="sm" />
          <span class="truncate max-w-[100px]">{{ user.display_name ?? user.username }}</span>
          <button
            class="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            @click="removeSelectedUser(user.id)"
          >
            <PhX :size="12" weight="bold" />
          </button>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="px-6 py-4">
      <div
        class="flex items-center gap-3 rounded-full border border-border bg-white/50 px-4 py-2.5"
      >
        <PhMagnifyingGlass :size="18" class="text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="
            mode === 'direct' ? 'Search by username or display name...' : 'Search members to add...'
          "
          class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>

    <!-- Results -->
    <div class="flex-1 overflow-y-auto px-4">
      <!-- Searching -->
      <div v-if="isSearching" class="flex items-center justify-center py-12">
        <PhSpinner :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Empty prompt -->
      <div
        v-else-if="!searchQuery.trim()"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <PhUser :size="40" class="mb-3 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          {{
            mode === 'direct'
              ? 'Search for users to start a conversation'
              : 'Search for users to add to your group'
          }}
        </p>
      </div>

      <!-- No results -->
      <div
        v-else-if="searchResults.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <p class="text-sm text-muted-foreground">No users found matching "{{ searchQuery }}"</p>
      </div>

      <!-- User list -->
      <div v-else class="space-y-1">
        <div
          v-for="user in searchResults"
          :key="user.id"
          :class="[
            'flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200',
            mode === 'group' && selectedUserIds.has(user.id) ? 'bg-primary/10' : 'hover:bg-muted',
          ]"
          @click="mode === 'group' ? toggleUserSelection(user.id) : undefined"
        >
          <!-- Selection indicator (group mode) -->
          <div
            v-if="mode === 'group'"
            :class="[
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
              selectedUserIds.has(user.id)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border',
            ]"
          >
            <PhCheck v-if="selectedUserIds.has(user.id)" :size="14" weight="bold" />
          </div>

          <RouterLink :to="`/contacts/${user.id}`" class="shrink-0" @click.stop>
            <Avatar
              :src="user.avatar_url"
              :alt="user.display_name ?? user.username"
              size="md"
              :status="user.status"
            />
          </RouterLink>
          <RouterLink :to="`/contacts/${user.id}`" class="min-w-0 flex-1" @click.stop>
            <p class="truncate font-medium text-foreground">
              {{ user.display_name ?? user.username }}
            </p>
            <p class="truncate text-xs text-muted-foreground">@{{ user.username }}</p>
          </RouterLink>
          <div class="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              :disabled="addingFriendId === user.id"
              @click.stop="sendFriendRequest(user.id)"
            >
              <PhSpinner v-if="addingFriendId === user.id" :size="16" class="animate-spin" />
              <PhUserPlus v-else :size="16" weight="bold" />
              <span class="text-xs">Add</span>
            </Button>
            <Button
              v-if="mode === 'direct'"
              size="sm"
              :disabled="isCreating"
              @click.stop="startConversation(user.id)"
            >
              <PhChatCircleText :size="16" weight="fill" />
              <span class="text-xs">Chat</span>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Group Create Button -->
    <div v-if="mode === 'group'" class="border-t border-border/30 px-6 py-4">
      <Button
        type="button"
        class="w-full"
        :disabled="!canCreateGroup || isCreating"
        @click="createGroup"
      >
        <PhSpinner v-if="isCreating" :size="18" class="animate-spin" />
        <span v-else>Create Group</span>
      </Button>
    </div>

    <!-- Error -->
    <div v-if="createError || addFriendError" class="border-t border-border/30 px-6 py-3">
      <p class="text-center text-sm text-destructive">{{ createError || addFriendError }}</p>
    </div>
  </div>
</template>
