<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhMagnifyingGlass, PhUserPlus } from '@phosphor-icons/vue'
import Avatar from '@/components/ui/Avatar.vue'

interface Contact {
  id: string
  name: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: string
}

const searchQuery = ref('')

const contacts = ref<Contact[]>([
  { id: '1', name: 'Alice Chen', status: 'online' },
  { id: '2', name: 'Bob Smith', status: 'away', lastSeen: '2h ago' },
  { id: '3', name: 'Carol White', status: 'offline', lastSeen: '1d ago' },
  { id: '4', name: 'David Park', status: 'online' },
])

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value
  const q = searchQuery.value.toLowerCase()
  return contacts.value.filter((c) => c.name.toLowerCase().includes(q))
})
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="border-b border-border/30 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-foreground">Contacts</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ contacts.length }} contacts</p>
        </div>
        <RouterLink
          to="/new-conversation"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <PhUserPlus :size="20" weight="bold" />
        </RouterLink>
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
          placeholder="Search contacts..."
          class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto px-4">
      <div class="space-y-1">
        <RouterLink
          v-for="contact in filteredContacts"
          :key="contact.id"
          :to="`/contacts/${contact.id}`"
          class="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:bg-muted"
        >
          <Avatar :alt="contact.name" :status="contact.status" size="md" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-foreground">
              {{ contact.name }}
            </p>
            <p class="text-xs text-muted-foreground">
              <template v-if="contact.status === 'online'">Online</template>
              <template v-else-if="contact.lastSeen">Last seen {{ contact.lastSeen }}</template>
              <template v-else>Offline</template>
            </p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
