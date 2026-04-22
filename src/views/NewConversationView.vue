<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhMagnifyingGlass, PhArrowLeft, PhChatCircleText } from '@phosphor-icons/vue'
import Avatar from '@/components/ui/Avatar.vue'

interface User {
  id: string
  name: string
  email: string
}

const searchQuery = ref('')
const selectedUserIds = ref<string[]>([])

const users = ref<User[]>([
  { id: '1', name: 'Alice Chen', email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
  { id: '3', name: 'Carol White', email: 'carol@example.com' },
  { id: '4', name: 'David Park', email: 'david@example.com' },
])

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

function toggleUser(id: string) {
  const idx = selectedUserIds.value.indexOf(id)
  if (idx > -1) {
    selectedUserIds.value.splice(idx, 1)
  } else {
    selectedUserIds.value.push(id)
  }
}

function startConversation() {
  // TODO: create conversation via chat store
  console.log('Start conversation with:', selectedUserIds.value)
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

    <!-- Search -->
    <div class="px-6 py-4">
      <div
        class="flex items-center gap-3 rounded-full border border-border bg-white/50 px-4 py-2.5"
      >
        <PhMagnifyingGlass :size="18" class="text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>

    <!-- User list -->
    <div class="flex-1 overflow-y-auto px-4">
      <div class="space-y-1">
        <button
          v-for="user in filteredUsers"
          :key="user.id"
          :class="[
            'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200',
            selectedUserIds.includes(user.id) ? 'bg-primary/10' : 'hover:bg-muted',
          ]"
          @click="toggleUser(user.id)"
        >
          <Avatar :alt="user.name" size="md" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-foreground">
              {{ user.name }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ user.email }}
            </p>
          </div>
          <div
            :class="[
              'h-5 w-5 rounded-full border-2 transition-all duration-200',
              selectedUserIds.includes(user.id) ? 'border-primary bg-primary' : 'border-border',
            ]"
          >
            <svg
              v-if="selectedUserIds.includes(user.id)"
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
        :disabled="selectedUserIds.length === 0"
        class="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-hover disabled:opacity-50 disabled:hover:shadow-none"
        @click="startConversation"
      >
        <PhChatCircleText :size="18" weight="fill" />
        <span>Start Conversation ({{ selectedUserIds.length }})</span>
      </button>
    </div>
  </div>
</template>
