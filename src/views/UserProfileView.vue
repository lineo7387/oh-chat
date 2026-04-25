<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhArrowLeft,
  PhChatCircleDots,
  PhUserPlus,
  PhCheck,
  PhX,
  PhUserMinus,
  PhSpinner,
  PhPushPin,
  PhBell,
  PhBellSlash,
  PhPencilSimple,
} from '@phosphor-icons/vue'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { useFriendStore } from '@/stores/friend'
import { useChatStore } from '@/stores/chat'
import { useConversationSettingsStore } from '@/stores/conversationSettings'
import Avatar from '@/components/ui/Avatar.vue'
import Button from '@/components/ui/Button.vue'
import type { Profile } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const friendStore = useFriendStore()
const chatStore = useChatStore()
const settingsStore = useConversationSettingsStore()

const userId = ref(route.params.userId as string)
const profile = ref<Profile | null>(null)
const isLoading = ref(true)
const friendshipStatus = ref<'pending' | 'accepted' | 'rejected' | null>(null)
const isMyProfile = ref(false)
const isActionLoading = ref(false)
const friendRecordId = ref<string | null>(null)
const isSender = ref(false)
const requestError = ref('')
const isSavingNote = ref(false)
const noteInput = ref('')
const isEditingNote = ref(false)

// Find existing direct conversation with this user
const directConversation = computed(() => {
  return chatStore.conversations.find(
    (c) => c.type === 'direct' && c.participants.some((p) => p.user_id === userId.value),
  )
})

const directConversationId = computed(() => directConversation.value?.id)

const isPinned = computed(() =>
  directConversationId.value ? settingsStore.isPinned(directConversationId.value) : false,
)

const isMuted = computed(() =>
  directConversationId.value ? settingsStore.isMuted(directConversationId.value) : false,
)

const customName = computed(() =>
  directConversationId.value ? settingsStore.getCustomName(directConversationId.value) : null,
)

async function loadProfile(id: string) {
  isLoading.value = true
  isMyProfile.value = id === authStore.user?.id

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, avatar_url, bio, status, last_seen, created_at, updated_at',
    )
    .eq('id', id)
    .single()

  if (!error && data) {
    profile.value = data as unknown as Profile
    if (!isMyProfile.value) {
      await loadFriendshipStatus(id)
    }
  }
  isLoading.value = false
}

async function loadFriendshipStatus(otherId: string) {
  const authId = authStore.user?.id
  if (!authId) return

  const { data, error } = await supabase
    .from('friends')
    .select('id, status, sender_id')
    .or(
      `and(sender_id.eq.${authId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${authId})`,
    )
    .maybeSingle()

  if (!error && data) {
    friendshipStatus.value = data.status as 'pending' | 'accepted' | 'rejected'
    friendRecordId.value = data.id as string
    isSender.value = data.sender_id === authId
  } else {
    friendshipStatus.value = null
    friendRecordId.value = null
    isSender.value = false
  }
}

watch(
  () => route.params.userId as string,
  (newId) => {
    if (newId) {
      userId.value = newId
      loadProfile(newId)
    }
  },
  { immediate: true },
)

async function sendRequest() {
  if (!userId.value) return
  isActionLoading.value = true
  requestError.value = ''
  const result = await friendStore.sendFriendRequest(userId.value)
  isActionLoading.value = false
  if (result.success) {
    await loadFriendshipStatus(userId.value)
  } else {
    requestError.value = result.error ?? 'Failed to send request'
  }
}

async function acceptRequest() {
  if (!friendRecordId.value) return
  isActionLoading.value = true
  await friendStore.acceptFriendRequest(friendRecordId.value)
  isActionLoading.value = false
  await loadFriendshipStatus(userId.value)
}

async function rejectRequest() {
  if (!friendRecordId.value) return
  isActionLoading.value = true
  await friendStore.rejectFriendRequest(friendRecordId.value)
  isActionLoading.value = false
  await loadFriendshipStatus(userId.value)
}

async function removeFriendship() {
  if (!friendRecordId.value) return
  isActionLoading.value = true
  await friendStore.removeFriend(friendRecordId.value)
  isActionLoading.value = false
  await loadFriendshipStatus(userId.value)
}

async function startChat() {
  if (!userId.value) return
  const result = await chatStore.createDirectConversation(userId.value)
  if (result.success) {
    await chatStore.fetchConversations()
    router.push(`/chat/${result.conversationId}`)
  }
}

async function togglePin() {
  if (!directConversationId.value) return
  await settingsStore.togglePin(directConversationId.value)
}

async function toggleMute() {
  if (!directConversationId.value) return
  await settingsStore.toggleMute(directConversationId.value)
}

function startEditNote() {
  noteInput.value = customName.value ?? ''
  isEditingNote.value = true
}

async function saveNote() {
  if (!directConversationId.value) return
  isSavingNote.value = true
  await settingsStore.setCustomName(directConversationId.value, noteInput.value)
  isSavingNote.value = false
  isEditingNote.value = false
}

function cancelEditNote() {
  isEditingNote.value = false
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], { month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border/30 px-4 py-3">
      <RouterLink
        to="/contacts"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
      >
        <PhArrowLeft :size="22" class="text-foreground" />
      </RouterLink>
      <h1 class="font-heading text-lg font-semibold text-foreground">Profile</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <PhSpinner :size="32" class="animate-spin text-muted-foreground" />
    </div>

    <!-- Content -->
    <div v-else-if="profile" class="flex-1 overflow-y-auto px-6 py-8">
      <div class="mx-auto max-w-md text-center">
        <Avatar
          size="lg"
          :src="profile.avatar_url"
          :alt="profile.display_name ?? profile.username"
          :status="profile.status"
          class="mx-auto h-24 w-24"
        />

        <h2 class="mt-4 font-heading text-2xl font-bold text-foreground">
          {{ profile.display_name ?? profile.username }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">@{{ profile.username }}</p>

        <p v-if="profile.bio" class="mt-4 text-foreground/80">
          {{ profile.bio }}
        </p>

        <!-- Actions -->
        <div class="mt-6 flex items-center justify-center gap-3">
          <!-- My profile: go to settings -->
          <template v-if="isMyProfile">
            <RouterLink to="/settings">
              <Button variant="secondary">Edit Profile</Button>
            </RouterLink>
          </template>

          <!-- Not friends: add friend button -->
          <template v-else-if="!friendshipStatus">
            <Button :disabled="isActionLoading" @click="sendRequest">
              <PhSpinner v-if="isActionLoading" :size="18" class="animate-spin" />
              <PhUserPlus v-else :size="18" weight="bold" />
              <span>Add Friend</span>
            </Button>
            <Button variant="secondary" @click="startChat">
              <PhChatCircleDots :size="18" weight="fill" />
              <span>Message</span>
            </Button>
          </template>

          <!-- Pending: show status + action -->
          <template v-else-if="friendshipStatus === 'pending'">
            <template v-if="isSender">
              <span class="rounded-full bg-accent px-4 py-2 text-sm text-foreground/70">
                Request Sent
              </span>
              <Button variant="ghost" :disabled="isActionLoading" @click="removeFriendship">
                <PhX :size="18" />
                <span>Cancel</span>
              </Button>
            </template>
            <template v-else>
              <Button :disabled="isActionLoading" @click="acceptRequest">
                <PhCheck :size="18" weight="bold" />
                <span>Accept</span>
              </Button>
              <Button variant="ghost" :disabled="isActionLoading" @click="rejectRequest">
                <PhX :size="18" />
                <span>Decline</span>
              </Button>
            </template>
          </template>

          <!-- Friends: message + remove -->
          <template v-else-if="friendshipStatus === 'accepted'">
            <Button @click="startChat">
              <PhChatCircleDots :size="18" weight="fill" />
              <span>Message</span>
            </Button>
            <Button variant="ghost" :disabled="isActionLoading" @click="removeFriendship">
              <PhUserMinus :size="18" />
              <span>Remove</span>
            </Button>
          </template>
        </div>

        <p v-if="requestError" class="mt-3 text-center text-sm text-destructive">
          {{ requestError }}
        </p>

        <!-- Conversation settings (only if chat exists) -->
        <div
          v-if="friendshipStatus === 'accepted' && directConversationId"
          class="mx-auto mt-6 max-w-sm space-y-3"
        >
          <div class="rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Conversation Settings
            </p>

            <!-- Custom name -->
            <div class="mt-3">
              <div v-if="isEditingNote" class="flex items-center gap-2">
                <input
                  v-model="noteInput"
                  type="text"
                  placeholder="Custom name..."
                  class="h-10 flex-1 rounded-full border border-border bg-white/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  @keydown.enter.prevent="saveNote"
                />
                <button
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  :disabled="isSavingNote"
                  @click="saveNote"
                >
                  <PhCheck v-if="!isSavingNote" :size="16" weight="bold" />
                  <PhSpinner v-else :size="16" class="animate-spin" />
                </button>
                <button
                  class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  @click="cancelEditNote"
                >
                  <PhX :size="16" weight="bold" />
                </button>
              </div>
              <div v-else class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Custom Name</p>
                  <p class="text-sm text-foreground">
                    {{ customName || 'No custom name set' }}
                  </p>
                </div>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  @click="startEditNote"
                >
                  <PhPencilSimple :size="16" />
                </button>
              </div>
            </div>

            <!-- Pin / Mute toggles -->
            <div class="mt-3 flex items-center gap-3">
              <button
                :class="[
                  'flex flex-1 items-center justify-center gap-2 rounded-full border py-2 text-sm font-medium transition-all duration-200',
                  isPinned
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border text-foreground hover:bg-muted',
                ]"
                @click="togglePin"
              >
                <PhPushPin :size="16" :weight="isPinned ? 'fill' : 'regular'" />
                <span>{{ isPinned ? 'Pinned' : 'Pin' }}</span>
              </button>
              <button
                :class="[
                  'flex flex-1 items-center justify-center gap-2 rounded-full border py-2 text-sm font-medium transition-all duration-200',
                  isMuted
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border text-foreground hover:bg-muted',
                ]"
                @click="toggleMute"
              >
                <component :is="isMuted ? PhBellSlash : PhBell" :size="16" />
                <span>{{ isMuted ? 'Muted' : 'Mute' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Info cards -->
        <div class="mt-8 space-y-3 text-left">
          <div class="rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <p class="mt-1 flex items-center gap-2 text-sm text-foreground">
              <span
                class="inline-block h-2 w-2 rounded-full"
                :class="
                  profile.status === 'online'
                    ? 'bg-emerald-500'
                    : profile.status === 'away'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                "
              />
              <span class="capitalize">{{ profile.status }}</span>
            </p>
          </div>
          <div class="rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member Since
            </p>
            <p class="mt-1 text-sm text-foreground">{{ formatJoinDate(profile.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="flex flex-1 flex-col items-center justify-center text-center">
      <p class="text-muted-foreground">User not found</p>
    </div>
  </div>
</template>
