<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  PhX,
  PhUsers,
  PhPencilSimple,
  PhCheck,
  PhPlus,
  PhSignOut,
  PhMagnifyingGlass,
  PhSpinner,
} from '@phosphor-icons/vue'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import Avatar from '@/components/ui/Avatar.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import type { ConversationWithMeta } from '@/stores/chat'

interface Props {
  conversation: ConversationWithMeta | null
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  left: []
}>()

const authStore = useAuthStore()
const chatStore = useChatStore()

const isEditingTitle = ref(false)
const editTitleValue = ref('')
const isSavingTitle = ref(false)

const showAddMember = ref(false)
const searchQuery = ref('')
const searchResults = ref<
  Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>
>([])
const isSearching = ref(false)
const isAddingMember = ref<string | null>(null)
const addMemberError = ref('')

const isLeaving = ref(false)
const leaveError = ref('')

const currentUserRole = computed(() => {
  if (!props.conversation || !authStore.user) return null
  const participant = props.conversation.participants.find((p) => p.user_id === authStore.user!.id)
  return participant?.role ?? null
})

const canManage = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
})

const memberCount = computed(() => {
  return props.conversation?.participants.length ?? 0
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      isEditingTitle.value = false
      showAddMember.value = false
      searchQuery.value = ''
      searchResults.value = []
      addMemberError.value = ''
      leaveError.value = ''
    }
  },
)

function startEditTitle() {
  editTitleValue.value = props.conversation?.title ?? ''
  isEditingTitle.value = true
}

async function saveTitle() {
  if (!props.conversation || !editTitleValue.value.trim()) return
  isSavingTitle.value = true
  const result = await chatStore.updateGroupTitle(
    props.conversation.id,
    editTitleValue.value.trim(),
  )
  isSavingTitle.value = false
  if (result.success) {
    isEditingTitle.value = false
  }
}

function cancelEditTitle() {
  isEditingTitle.value = false
}

// Debounced search for adding members
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
  if (!props.conversation) return
  isSearching.value = true
  const existingIds = props.conversation.participants.map((p) => p.user_id)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .not('id', 'in', `(${existingIds.join(',')})`)
    .neq('id', authStore.user?.id ?? '')
    .limit(10)

  if (!error) {
    searchResults.value = (data ?? []) as typeof searchResults.value
  }
  isSearching.value = false
}

async function addMember(userId: string) {
  if (!props.conversation) return
  isAddingMember.value = userId
  addMemberError.value = ''
  const result = await chatStore.addGroupMembers(props.conversation.id, [userId])
  isAddingMember.value = null
  if (result.success) {
    searchQuery.value = ''
    searchResults.value = []
  } else {
    addMemberError.value = result.error ?? 'Failed to add member'
  }
}

async function leaveGroup() {
  if (!props.conversation || !authStore.user) return
  if (!confirm('Are you sure you want to leave this group?')) return
  isLeaving.value = true
  leaveError.value = ''
  const result = await chatStore.removeGroupMember(props.conversation.id, authStore.user.id)
  isLeaving.value = false
  if (result.success) {
    emit('close')
    emit('left')
  } else {
    leaveError.value = result.error ?? 'Failed to leave group'
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="panel">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-foreground/20 backdrop-blur-sm" @click="close" />

      <!-- Panel -->
      <div class="relative flex h-full w-80 flex-col bg-card shadow-xl md:w-96">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border/30 px-5 py-4">
          <h2 class="font-heading text-lg font-semibold text-foreground">Group Info</h2>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            @click="close"
          >
            <PhX :size="20" class="text-foreground" />
          </button>
        </div>

        <!-- Content -->
        <div v-if="conversation" class="flex-1 overflow-y-auto px-5 py-4">
          <!-- Group Title -->
          <div class="mb-6 text-center">
            <div class="mb-3 flex justify-center">
              <Avatar
                :src="chatStore.getConversationAvatar(conversation)"
                :alt="chatStore.getConversationName(conversation)"
                size="lg"
              />
            </div>

            <div v-if="isEditingTitle" class="flex items-center gap-2">
              <Input v-model="editTitleValue" class="flex-1" placeholder="Group name" />
              <button
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                :disabled="isSavingTitle"
                @click="saveTitle"
              >
                <PhSpinner v-if="isSavingTitle" :size="16" class="animate-spin" />
                <PhCheck v-else :size="16" weight="bold" />
              </button>
              <button
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                @click="cancelEditTitle"
              >
                <PhX :size="16" />
              </button>
            </div>
            <div v-else class="flex items-center justify-center gap-2">
              <h3 class="font-heading text-xl font-bold text-foreground">
                {{ chatStore.getConversationName(conversation) }}
              </h3>
              <button
                v-if="canManage"
                class="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                @click="startEditTitle"
              >
                <PhPencilSimple :size="14" />
              </button>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">{{ memberCount }} members</p>
          </div>

          <!-- Members -->
          <div class="mb-6">
            <div class="mb-2 flex items-center gap-2">
              <PhUsers :size="16" class="text-muted-foreground" />
              <span class="text-sm font-semibold text-foreground">Members</span>
            </div>
            <div class="space-y-1">
              <div
                v-for="p in conversation.participants"
                :key="p.user_id"
                class="flex items-center gap-3 rounded-2xl px-3 py-2"
              >
                <Avatar
                  :src="p.profile?.avatar_url"
                  :alt="p.profile?.display_name ?? p.profile?.username ?? ''"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ p.profile?.display_name ?? p.profile?.username ?? 'Unknown' }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">@{{ p.profile?.username }}</p>
                </div>
                <span
                  v-if="p.role !== 'member'"
                  :class="[
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    p.role === 'owner'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/10 text-secondary',
                  ]"
                >
                  {{ p.role }}
                </span>
              </div>
            </div>
          </div>

          <!-- Add Member -->
          <div v-if="canManage" class="mb-6">
            <Button
              v-if="!showAddMember"
              type="button"
              variant="outline"
              class="w-full"
              @click="showAddMember = true"
            >
              <PhPlus :size="16" weight="bold" />
              <span>Add Member</span>
            </Button>

            <div v-else class="space-y-3">
              <div class="flex items-center gap-2">
                <div
                  class="flex flex-1 items-center gap-2 rounded-full border border-border bg-white/50 px-3 py-2"
                >
                  <PhMagnifyingGlass :size="16" class="text-muted-foreground" />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search users..."
                    class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <button
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  @click="showAddMember = false"
                >
                  <PhX :size="16" />
                </button>
              </div>

              <div v-if="isSearching" class="flex justify-center py-4">
                <PhSpinner :size="20" class="animate-spin text-muted-foreground" />
              </div>

              <div v-else-if="searchResults.length > 0" class="space-y-1">
                <div
                  v-for="user in searchResults"
                  :key="user.id"
                  class="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-muted"
                >
                  <Avatar
                    :src="user.avatar_url"
                    :alt="user.display_name ?? user.username"
                    size="sm"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-foreground">
                      {{ user.display_name ?? user.username }}
                    </p>
                    <p class="truncate text-xs text-muted-foreground">@{{ user.username }}</p>
                  </div>
                  <Button
                    size="sm"
                    :disabled="isAddingMember === user.id"
                    @click="addMember(user.id)"
                  >
                    <PhSpinner v-if="isAddingMember === user.id" :size="14" class="animate-spin" />
                    <PhPlus v-else :size="14" weight="bold" />
                    <span class="text-xs">Add</span>
                  </Button>
                </div>
              </div>

              <p v-if="addMemberError" class="text-center text-sm text-destructive">
                {{ addMemberError }}
              </p>
            </div>
          </div>

          <!-- Leave Group -->
          <div class="border-t border-border/30 pt-4">
            <Button
              type="button"
              variant="ghost"
              class="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              :disabled="isLeaving"
              @click="leaveGroup"
            >
              <PhSpinner v-if="isLeaving" :size="18" class="animate-spin" />
              <PhSignOut v-else :size="18" />
              <span>Leave Group</span>
            </Button>
            <p v-if="leaveError" class="mt-2 text-center text-sm text-destructive">
              {{ leaveError }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease-organic;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-active > div:last-child,
.panel-leave-active > div:last-child {
  transition: transform 0.2s ease-organic;
}
.panel-enter-from > div:last-child,
.panel-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
