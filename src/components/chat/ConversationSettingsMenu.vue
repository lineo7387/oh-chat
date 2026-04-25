<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import {
  PhDotsThreeVertical,
  PhPushPin,
  PhBell,
  PhBellSlash,
  PhPencilSimple,
  PhCheck,
  PhX,
} from '@phosphor-icons/vue'
import { useConversationSettingsStore } from '@/stores/conversationSettings'

const props = defineProps<{
  conversationId: string
}>()

const settingsStore = useConversationSettingsStore()

const isOpen = ref(false)
const isEditingNote = ref(false)
const noteInput = ref('')
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => {
  isOpen.value = false
  isEditingNote.value = false
})

const isPinned = () => settingsStore.isPinned(props.conversationId)
const isMuted = () => settingsStore.isMuted(props.conversationId)
const currentNote = () => settingsStore.getCustomName(props.conversationId) ?? ''

async function togglePin() {
  await settingsStore.togglePin(props.conversationId)
  isOpen.value = false
}

async function toggleMute() {
  await settingsStore.toggleMute(props.conversationId)
  isOpen.value = false
}

function startEditNote() {
  noteInput.value = currentNote()
  isEditingNote.value = true
}

async function saveNote() {
  await settingsStore.setCustomName(props.conversationId, noteInput.value)
  isEditingNote.value = false
}

function cancelEditNote() {
  isEditingNote.value = false
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      @click.stop="isOpen = !isOpen"
    >
      <PhDotsThreeVertical :size="18" />
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-[1.25rem] border border-border bg-card py-1.5 shadow-soft"
    >
      <!-- Edit Note inline form -->
      <div v-if="isEditingNote" class="px-3 py-2">
        <div
          class="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
        >
          <input
            v-model="noteInput"
            type="text"
            placeholder="Custom name..."
            class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            @keydown.enter.prevent="saveNote"
          />
          <button
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
            @click="saveNote"
          >
            <PhCheck :size="14" weight="bold" />
          </button>
          <button
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            @click="cancelEditNote"
          >
            <PhX :size="14" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Menu items -->
      <template v-else>
        <button
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
          @click.stop="togglePin"
        >
          <PhPushPin :size="16" :weight="isPinned() ? 'fill' : 'regular'" />
          <span>{{ isPinned() ? 'Unpin Conversation' : 'Pin Conversation' }}</span>
        </button>

        <button
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
          @click.stop="toggleMute"
        >
          <component :is="isMuted() ? PhBellSlash : PhBell" :size="16" />
          <span>{{ isMuted() ? 'Unmute Notifications' : 'Mute Notifications' }}</span>
        </button>

        <div class="mx-3 my-1 h-px bg-border/50" />

        <button
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
          @click.stop="startEditNote"
        >
          <PhPencilSimple :size="16" />
          <span>Edit Note</span>
        </button>
      </template>
    </div>
  </div>
</template>
