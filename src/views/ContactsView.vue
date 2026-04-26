<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhMagnifyingGlass,
  PhUserPlus,
  PhCheck,
  PhX,
  PhChatCircleDots,
  PhUserMinus,
  PhUser,
  PhArrowLeft,
} from '@phosphor-icons/vue'
import { useFriendStore } from '@/stores/friend'
import { useChatStore } from '@/stores/chat'
import Avatar from '@/components/ui/Avatar.vue'

const router = useRouter()
const friendStore = useFriendStore()
const chatStore = useChatStore()

const searchQuery = ref('')
const activeTab = ref<'friends' | 'requests'>('friends')

onMounted(() => {
  friendStore.fetchFriends()
  friendStore.fetchPendingRequests()
})

const filteredFriends = computed(() => {
  if (!searchQuery.value) return friendStore.friends
  const q = searchQuery.value.toLowerCase()
  return friendStore.friends.filter(
    (f) =>
      f.otherProfile.display_name?.toLowerCase().includes(q) ||
      f.otherProfile.username.toLowerCase().includes(q),
  )
})

async function acceptRequest(friendId: string) {
  await friendStore.acceptFriendRequest(friendId)
}

async function rejectRequest(friendId: string) {
  await friendStore.rejectFriendRequest(friendId)
}

async function removeFriend(friendId: string) {
  await friendStore.removeFriend(friendId)
}

async function startChat(userId: string) {
  const result = await chatStore.createDirectConversation(userId)
  if (result.success) {
    await chatStore.fetchConversations()
    router.push(`/chat/${result.conversationId}`)
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="border-b border-border/30 px-6 py-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink
            to="/"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted md:hidden"
          >
            <PhArrowLeft :size="22" class="text-foreground" />
          </RouterLink>
          <div class="min-w-0">
            <h1 class="font-heading text-2xl font-bold text-foreground">Contacts</h1>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ friendStore.friends.length }} friends
              <span v-if="friendStore.pendingCount > 0" class="ml-1 text-secondary">
                · {{ friendStore.pendingCount }} pending
              </span>
            </p>
          </div>
        </div>
        <RouterLink
          to="/new-conversation"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <PhUserPlus :size="20" weight="bold" />
        </RouterLink>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-border/30 px-6">
      <button
        class="relative px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activeTab === 'friends'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'friends'"
      >
        Friends
        <div
          v-if="activeTab === 'friends'"
          class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
        />
      </button>
      <button
        class="relative px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activeTab === 'requests'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'requests'"
      >
        Requests
        <span
          v-if="friendStore.pendingCount > 0"
          class="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold text-white"
        >
          {{ friendStore.pendingCount }}
        </span>
        <div
          v-if="activeTab === 'requests'"
          class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
        />
      </button>
    </div>

    <!-- Search (friends tab only) -->
    <div v-if="activeTab === 'friends'" class="px-6 py-4">
      <div
        class="flex items-center gap-3 rounded-full border border-border bg-white/50 px-4 py-2.5"
      >
        <PhMagnifyingGlass :size="18" class="text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search friends..."
          class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4">
      <div v-if="friendStore.isLoading" class="space-y-2 py-4">
        <div
          v-for="i in 3"
          :key="i"
          class="flex animate-pulse items-center gap-3 rounded-2xl px-4 py-3"
        >
          <div class="h-10 w-10 shrink-0 rounded-full bg-muted" />
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="h-3 w-24 rounded bg-muted" />
            <div class="h-2.5 w-32 rounded bg-muted/60" />
          </div>
        </div>
      </div>

      <!-- Friends tab -->
      <div v-else-if="activeTab === 'friends'" class="py-2">
        <div
          v-if="filteredFriends.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <PhUser :size="40" class="mb-3 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">
            {{ searchQuery ? 'No friends match your search' : 'No friends yet' }}
          </p>
          <RouterLink
            v-if="!searchQuery"
            to="/new-conversation"
            class="mt-3 text-sm text-primary hover:underline"
          >
            Find people to add
          </RouterLink>
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="friend in filteredFriends"
            :key="friend.id"
            class="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:bg-muted"
          >
            <RouterLink :to="`/contacts/${friend.otherProfile.id}`">
              <Avatar
                :src="friend.otherProfile.avatar_url"
                :alt="friend.otherProfile.display_name ?? friend.otherProfile.username"
                size="md"
                :status="friend.otherProfile.status"
              />
            </RouterLink>
            <RouterLink :to="`/contacts/${friend.otherProfile.id}`" class="min-w-0 flex-1">
              <p class="truncate font-medium text-foreground">
                {{ friend.otherProfile.display_name ?? friend.otherProfile.username }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                @{{ friend.otherProfile.username }}
                <span v-if="friend.otherProfile.email" class="ml-1 text-muted-foreground/60"
                  >· {{ friend.otherProfile.email }}</span
                >
              </p>
            </RouterLink>
            <div class="flex items-center gap-1">
              <button
                class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                title="Send message"
                @click="startChat(friend.otherProfile.id)"
              >
                <PhChatCircleDots :size="18" />
              </button>
              <button
                class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Remove friend"
                @click="removeFriend(friend.id)"
              >
                <PhUserMinus :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Requests tab -->
      <div v-else class="py-2">
        <div
          v-if="friendStore.pendingRequests.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <PhUser :size="40" class="mb-3 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">No pending friend requests</p>
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="request in friendStore.pendingRequests"
            :key="request.id"
            class="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:bg-muted"
          >
            <RouterLink :to="`/contacts/${request.otherProfile.id}`">
              <Avatar
                :src="request.otherProfile.avatar_url"
                :alt="request.otherProfile.display_name ?? request.otherProfile.username"
                size="md"
                :status="request.otherProfile.status"
              />
            </RouterLink>
            <RouterLink :to="`/contacts/${request.otherProfile.id}`" class="min-w-0 flex-1">
              <p class="truncate font-medium text-foreground">
                {{ request.otherProfile.display_name ?? request.otherProfile.username }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                @{{ request.otherProfile.username }}
                <span v-if="request.otherProfile.email" class="ml-1 text-muted-foreground/60"
                  >· {{ request.otherProfile.email }}</span
                >
              </p>
            </RouterLink>
            <div class="flex items-center gap-1">
              <button
                class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                title="Accept"
                @click="acceptRequest(request.id)"
              >
                <PhCheck :size="18" weight="bold" />
              </button>
              <button
                class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Decline"
                @click="rejectRequest(request.id)"
              >
                <PhX :size="18" weight="bold" />
              </button>
            </div>
          </div>
        </div>

        <!-- Sent requests section -->
        <div v-if="friendStore.sentRequests.length > 0" class="mt-6">
          <p class="px-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sent
          </p>
          <div class="space-y-1">
            <div
              v-for="request in friendStore.sentRequests"
              :key="request.id"
              class="flex items-center gap-3 rounded-2xl px-4 py-3"
            >
              <Avatar
                :src="request.otherProfile.avatar_url"
                :alt="request.otherProfile.display_name ?? request.otherProfile.username"
                size="md"
                :status="request.otherProfile.status"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-foreground">
                  {{ request.otherProfile.display_name ?? request.otherProfile.username }}
                </p>
                <p class="truncate text-xs text-muted-foreground">
                  @{{ request.otherProfile.username }}
                  <span v-if="request.otherProfile.email" class="ml-1 text-muted-foreground/60"
                    >· {{ request.otherProfile.email }}</span
                  >
                </p>
              </div>
              <span class="rounded-full bg-accent px-3 py-1 text-xs text-foreground/70">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
