<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  PhUser,
  PhShield,
  PhPalette,
  PhSignOut,
  PhCamera,
  PhSpinner,
  PhChatCircle,
  PhPushPin,
  PhBellSlash,
  PhX,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useConversationSettingsStore } from '@/stores/conversationSettings'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Avatar from '@/components/ui/Avatar.vue'

type TabId = 'profile' | 'account' | 'appearance' | 'chat'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const settingsStore = useConversationSettingsStore()
const activeTab = ref<TabId>('profile')

const tabs = [
  { id: 'profile' as TabId, label: 'Profile', icon: PhUser },
  { id: 'account' as TabId, label: 'Account', icon: PhShield },
  { id: 'appearance' as TabId, label: 'Appearance', icon: PhPalette },
  { id: 'chat' as TabId, label: 'Chat', icon: PhChatCircle },
]

const pinnedConversations = computed(() => {
  return chatStore.conversations
    .filter((c) => settingsStore.isPinned(c.id))
    .sort((a, b) => {
      const aTime = settingsStore.getSetting(a.id)?.pinned_at ?? ''
      const bTime = settingsStore.getSetting(b.id)?.pinned_at ?? ''
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
})

const mutedConversations = computed(() => {
  return chatStore.conversations.filter((c) => settingsStore.isMuted(c.id))
})

// Profile form
const displayName = ref(authStore.profile?.display_name || '')
const bio = ref(authStore.profile?.bio || '')
const isSaving = ref(false)
const saveError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadError = ref('')

watch(
  () => authStore.profile,
  (p) => {
    if (p) {
      displayName.value = p.display_name || ''
      bio.value = p.bio || ''
    }
  },
  { immediate: true },
)

function triggerAvatarSelect() {
  fileInput.value?.click()
}

async function onAvatarSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  uploadError.value = ''
  const result = await authStore.uploadAvatar(file)
  isUploading.value = false
  target.value = ''

  if (!result.success) {
    uploadError.value = result.error ?? 'Upload failed'
  }
}

async function saveProfile() {
  isSaving.value = true
  saveError.value = ''
  const result = await authStore.updateProfile({
    display_name: displayName.value.trim() || null,
    bio: bio.value.trim() || null,
  })
  isSaving.value = false
  if (!result.success) {
    saveError.value = result.error ?? 'Failed to save'
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="border-b border-border/30 px-6 py-4">
      <h1 class="font-heading text-2xl font-bold text-foreground">Settings</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Manage your profile, account, and preferences
      </p>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar tabs -->
      <nav class="w-56 shrink-0 border-r border-border/30 p-4">
        <div class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ]"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="18" weight="fill" />
            {{ tab.label }}
          </button>
        </div>
      </nav>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-8">
        <!-- Profile -->
        <div v-if="activeTab === 'profile'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Profile</h2>

          <!-- Avatar upload -->
          <div class="flex flex-col items-center gap-3">
            <button
              class="group relative rounded-full transition-transform duration-200 hover:scale-105"
              :disabled="isUploading"
              @click="triggerAvatarSelect"
            >
              <Avatar
                :src="authStore.profile?.avatar_url"
                :alt="authStore.profile?.display_name ?? authStore.profile?.username"
                size="xl"
                :status="authStore.profile?.status"
              />
              <div
                class="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <PhCamera :size="28" class="text-white" weight="fill" />
              </div>
              <div
                v-if="isUploading"
                class="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50"
              >
                <PhSpinner :size="28" class="animate-spin text-white" />
              </div>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarSelected"
            />
            <p class="text-xs text-muted-foreground">Click avatar to upload (max 2MB)</p>
            <p v-if="uploadError" class="text-sm text-destructive">{{ uploadError }}</p>
          </div>

          <!-- Form -->
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <div class="space-y-4">
              <!-- Username (read-only) -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">Username</label>
                <input
                  :value="authStore.profile?.username"
                  disabled
                  class="h-11 w-full rounded-full border border-border bg-muted/50 px-4 text-sm text-muted-foreground focus:outline-none"
                />
                <p class="mt-1 text-xs text-muted-foreground">Username cannot be changed</p>
              </div>

              <!-- Display name -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">Display Name</label>
                <input
                  v-model="displayName"
                  type="text"
                  placeholder="How you appear to others"
                  class="h-11 w-full rounded-full border border-border bg-white/50 px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <!-- Bio -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">Bio</label>
                <textarea
                  v-model="bio"
                  rows="3"
                  placeholder="Tell others a little about yourself"
                  class="w-full rounded-2xl border border-border bg-white/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <!-- Error -->
              <p v-if="saveError" class="text-sm text-destructive">{{ saveError }}</p>

              <!-- Save button -->
              <Button class="w-full" :disabled="isSaving" @click="saveProfile">
                <PhSpinner v-if="isSaving" :size="18" class="animate-spin" />
                <span v-else>Save Profile</span>
              </Button>
            </div>
          </div>
        </div>

        <!-- Account -->
        <div v-if="activeTab === 'account'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Account</h2>
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <p class="text-muted-foreground">
              Account settings will be available here. Change password, manage sessions, and
              security preferences.
            </p>
          </div>
          <div class="rounded-[2rem] border border-destructive/30 bg-card p-6 shadow-soft">
            <h3 class="font-heading text-sm font-semibold text-destructive">Danger Zone</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              Sign out of your account on this device.
            </p>
            <Button
              variant="outline"
              class="mt-4 border-destructive text-destructive hover:bg-destructive/10"
              @click="
                async () => {
                  await authStore.signOut()
                  router.push('/login')
                }
              "
            >
              <PhSignOut :size="18" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        <!-- Appearance -->
        <div v-if="activeTab === 'appearance'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Appearance</h2>
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <p class="text-muted-foreground">
              Appearance settings will be available here. Customize themes, font sizes, and display
              preferences.
            </p>
          </div>
        </div>

        <!-- Chat -->
        <div v-if="activeTab === 'chat'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Chat Settings</h2>

          <!-- Pinned Conversations -->
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <div class="flex items-center gap-2">
              <PhPushPin :size="18" class="text-secondary" />
              <h3 class="font-heading text-sm font-semibold text-foreground">Pinned Conversations</h3>
            </div>
            <div v-if="pinnedConversations.length === 0" class="mt-3 text-sm text-muted-foreground">
              No pinned conversations.
            </div>
            <div v-else class="mt-3 space-y-2">
              <div
                v-for="conv in pinnedConversations"
                :key="conv.id"
                class="flex items-center gap-3 rounded-2xl border border-border/30 bg-background px-3 py-2.5"
              >
                <Avatar
                  :src="chatStore.getConversationAvatar(conv)"
                  :alt="chatStore.getConversationName(conv)"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ chatStore.getConversationName(conv) }}
                  </p>
                </div>
                <button
                  class="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  @click="settingsStore.togglePin(conv.id)"
                >
                  <PhX :size="14" weight="bold" />
                </button>
              </div>
            </div>
          </div>

          <!-- Muted Conversations -->
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <div class="flex items-center gap-2">
              <PhBellSlash :size="18" class="text-destructive" />
              <h3 class="font-heading text-sm font-semibold text-foreground">Muted Conversations</h3>
            </div>
            <div v-if="mutedConversations.length === 0" class="mt-3 text-sm text-muted-foreground">
              No muted conversations.
            </div>
            <div v-else class="mt-3 space-y-2">
              <div
                v-for="conv in mutedConversations"
                :key="conv.id"
                class="flex items-center gap-3 rounded-2xl border border-border/30 bg-background px-3 py-2.5"
              >
                <Avatar
                  :src="chatStore.getConversationAvatar(conv)"
                  :alt="chatStore.getConversationName(conv)"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ chatStore.getConversationName(conv) }}
                  </p>
                </div>
                <button
                  class="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  @click="settingsStore.toggleMute(conv.id)"
                >
                  <PhX :size="14" weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
