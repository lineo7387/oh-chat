<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  PhX,
  PhPushPin,
  PhBell,
  PhBellSlash,
  PhPencilSimple,
  PhCheck,
  PhSpinner,
} from '@phosphor-icons/vue'
import { useChatStore } from '@/stores/chat'
import { useConversationSettingsStore } from '@/stores/conversationSettings'
import Avatar from '@/components/ui/Avatar.vue'
import Input from '@/components/ui/Input.vue'

interface Props {
  conversationId: string
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const chatStore = useChatStore()
const settingsStore = useConversationSettingsStore()

const isTogglingPin = ref(false)
const isTogglingMute = ref(false)
const isEditingNote = ref(false)
const noteInput = ref('')
const isSavingNote = ref(false)
const noteError = ref('')

const conversation = computed(() => {
  return chatStore.conversations.find((c) => c.id === props.conversationId) ?? null
})

const conversationName = computed(() => {
  if (!conversation.value) return ''
  return chatStore.getConversationName(conversation.value)
})

const conversationAvatar = computed(() => {
  if (!conversation.value) return ''
  return chatStore.getConversationAvatar(conversation.value)
})

const isPinned = computed(() => settingsStore.isPinned(props.conversationId))
const isMuted = computed(() => settingsStore.isMuted(props.conversationId))

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      isEditingNote.value = false
      noteError.value = ''
      const current = settingsStore.getCustomName(props.conversationId)
      noteInput.value = current ?? ''
    }
  },
)

async function togglePin() {
  isTogglingPin.value = true
  await settingsStore.togglePin(props.conversationId)
  isTogglingPin.value = false
}

async function toggleMute() {
  isTogglingMute.value = true
  await settingsStore.toggleMute(props.conversationId)
  isTogglingMute.value = false
}

function startEditNote() {
  noteInput.value = settingsStore.getCustomName(props.conversationId) ?? ''
  isEditingNote.value = true
}

async function saveNote() {
  isSavingNote.value = true
  noteError.value = ''
  const result = await settingsStore.setCustomName(props.conversationId, noteInput.value)
  isSavingNote.value = false
  if (result.success) {
    isEditingNote.value = false
  } else {
    noteError.value = result.error ?? 'Failed to save note'
  }
}

function cancelEditNote() {
  isEditingNote.value = false
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
          <h2 class="font-heading text-lg font-semibold text-foreground">Conversation Settings</h2>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            @click="close"
          >
            <PhX :size="20" class="text-foreground" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-5 py-6">
          <!-- Conversation Info -->
          <div class="mb-8 text-center">
            <div class="mb-3 flex justify-center">
              <Avatar :src="conversationAvatar" :alt="conversationName" size="lg" />
            </div>
            <h3 class="font-heading text-xl font-bold text-foreground">
              {{ conversationName }}
            </h3>
          </div>

          <!-- Settings List -->
          <div class="space-y-3">
            <!-- Pin -->
            <button
              class="flex w-full items-center justify-between rounded-2xl border border-border/50 bg-white/40 px-4 py-3 transition-colors hover:bg-muted"
              :disabled="isTogglingPin"
              @click="togglePin"
            >
              <div class="flex items-center gap-3">
                <PhPushPin
                  :size="18"
                  :weight="isPinned ? 'fill' : 'regular'"
                  class="text-secondary"
                />
                <span class="text-sm font-medium text-foreground">Pin Conversation</span>
              </div>
              <div
                :class="[
                  'h-6 w-10 rounded-full transition-colors duration-200',
                  isPinned ? 'bg-primary' : 'bg-muted',
                ]"
              >
                <div
                  :class="[
                    'h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200',
                    isPinned ? 'translate-x-4' : 'translate-x-0',
                  ]"
                />
              </div>
            </button>

            <!-- Mute -->
            <button
              class="flex w-full items-center justify-between rounded-2xl border border-border/50 bg-white/40 px-4 py-3 transition-colors hover:bg-muted"
              :disabled="isTogglingMute"
              @click="toggleMute"
            >
              <div class="flex items-center gap-3">
                <component :is="isMuted ? PhBellSlash : PhBell" :size="18" class="text-secondary" />
                <span class="text-sm font-medium text-foreground">Mute Notifications</span>
              </div>
              <div
                :class="[
                  'h-6 w-10 rounded-full transition-colors duration-200',
                  isMuted ? 'bg-primary' : 'bg-muted',
                ]"
              >
                <div
                  :class="[
                    'h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200',
                    isMuted ? 'translate-x-4' : 'translate-x-0',
                  ]"
                />
              </div>
            </button>

            <!-- Custom Name / Note -->
            <div class="rounded-2xl border border-border/50 bg-white/40 px-4 py-3">
              <div v-if="isEditingNote" class="space-y-2">
                <div class="flex items-center gap-2">
                  <Input v-model="noteInput" class="flex-1" placeholder="Custom name..." />
                  <button
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    :disabled="isSavingNote"
                    @click="saveNote"
                  >
                    <PhSpinner v-if="isSavingNote" :size="16" class="animate-spin" />
                    <PhCheck v-else :size="16" weight="bold" />
                  </button>
                  <button
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                    @click="cancelEditNote"
                  >
                    <PhX :size="16" />
                  </button>
                </div>
                <p v-if="noteError" class="text-xs text-destructive">{{ noteError }}</p>
              </div>
              <div v-else class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <PhPencilSimple :size="18" class="text-secondary" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground">Custom Name</p>
                    <p class="truncate text-xs text-muted-foreground">
                      {{ settingsStore.getCustomName(conversationId) || 'Add a note...' }}
                    </p>
                  </div>
                </div>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  @click="startEditNote"
                >
                  <PhPencilSimple :size="14" />
                </button>
              </div>
            </div>
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
