<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhMagnifyingGlass,
  PhArrowLeft,
  PhChatCircleText,
  PhUser,
  PhSpinner,
} from '@phosphor-icons/vue'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import Avatar from '@/components/ui/Avatar.vue'

interface SearchResultUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  status: 'online' | 'offline' | 'away'
}

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

const searchQuery = ref('')
const searchResults = ref<SearchResultUser[]>([])
const isSearching = ref(false)
const selectedUserId = ref<string | null>(null)
const isCreating = ref(false)

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

function selectUser(id: string) {
  selectedUserId.value = id
}

async function startConversation() {
  if (!selectedUserId.value) return
  isCreating.value = true

  const result = await chatStore.createDirectConversation(selectedUserId.value)

  if (result.success) {
    // Refresh conversations list and navigate
    await chatStore.fetchConversations()
    router.push(`/chat/${result.conversationId}`)
  }

  isCreating.value = false
}

const selectedUser = computed(() => searchResults.value.find((u) => u.id === selectedUserId.value))
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

    <!-- Search -->
    <div class="px-6 py-4">
      <div
        class="flex items-center gap-3 rounded-full border border-border bg-white/50 px-4 py-2.5"
      >
        <PhMagnifyingGlass :size="18" class="text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by username or display name..."
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
        <p class="text-sm text-muted-foreground">Search for users to start a conversation</p>
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
        <button
          v-for="user in searchResults"
          :key="user.id"
          :class="[
            'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200',
            selectedUserId === user.id ? 'bg-primary/10' : 'hover:bg-muted',
          ]"
          @click="selectUser(user.id)"
        >
          <Avatar
            :src="user.avatar_url"
            :alt="user.display_name ?? user.username"
            size="md"
            :status="user.status"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-foreground">
              {{ user.display_name ?? user.username }}
            </p>
            <p class="truncate text-xs text-muted-foreground">@{{ user.username }}</p>
          </div>
          <div
            :class="[
              'h-5 w-5 rounded-full border-2 transition-all duration-200',
              selectedUserId === user.id ? 'border-primary bg-primary' : 'border-border',
            ]"
          >
            <svg
              v-if="selectedUserId === user.id"
              class="h-full w-full text-primary-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- Footer action -->
    <div class="border-t border-border/30 px-6 py-4">
      <button
        :disabled="!selectedUserId || isCreating"
        class="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-hover disabled:opacity-50 disabled:hover:shadow-none"
        @click="startConversation"
      >
        <PhSpinner v-if="isCreating" :size="18" class="animate-spin" />
        <PhChatCircleText v-else :size="18" weight="fill" />
        <span>
          {{
            isCreating
              ? 'Creating...'
              : selectedUser
                ? `Chat with ${selectedUser.display_name ?? selectedUser.username}`
                : 'Select a user'
          }}
        </span>
      </button>
    </div>
  </div>
</template>
