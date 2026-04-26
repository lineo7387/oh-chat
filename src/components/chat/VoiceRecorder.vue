<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhMicrophone, PhX } from '@phosphor-icons/vue'
import { useVoiceRecorder } from '@/composables/useVoiceRecorder'

const emit = defineEmits<{
  send: [blob: Blob, duration: number]
  cancel: []
}>()

const {
  isRecording,
  duration,
  error,
  blob,
  isSupported,
  startRecording,
  stopRecording,
  cancelRecording,
} = useVoiceRecorder()

const isPressed = ref(false)
const MIN_DURATION = 1

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function onPointerDown() {
  if (!isSupported.value) return
  isPressed.value = true
  startRecording()
}

function onPointerUp() {
  isPressed.value = false
  if (!isRecording.value) return

  if (duration.value < MIN_DURATION) {
    cancelRecording()
    return
  }

  stopRecording()
}

function onCancelClick() {
  cancelRecording()
  emit('cancel')
}

// Watch for blob to be ready after stopRecording
watch(blob, (newBlob) => {
  if (newBlob && !isRecording.value && duration.value >= MIN_DURATION) {
    emit('send', newBlob, duration.value)
  }
})

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      if (!isRecording.value) {
        emit('cancel')
      }
    }, 1500)
  }
})
</script>

<template>
  <div class="flex items-center gap-2 rounded-full border border-border bg-white/50 px-4 py-2">
    <button
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      @click="onCancelClick"
    >
      <PhX :size="20" />
    </button>

    <div class="min-w-0 flex-1 text-center">
      <span v-if="error" class="text-sm text-destructive">{{ error }}</span>
      <span v-else-if="!isSupported" class="text-sm text-muted-foreground"
        >Microphone not available</span
      >
      <template v-else-if="isRecording">
        <span class="text-sm font-medium text-foreground">{{ formatDuration(duration) }}</span>
        <span class="ml-2 text-xs text-muted-foreground">Release to send</span>
      </template>
      <span v-else class="text-sm text-muted-foreground">Hold microphone button to record</span>
    </div>

    <button
      class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 select-none"
      :class="[
        isRecording ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground',
        isPressed ? 'scale-95' : 'hover:scale-105',
      ]"
      @pointerdown.prevent="onPointerDown"
      @pointerup.prevent="onPointerUp"
      @pointerleave.prevent="onPointerUp"
    >
      <PhMicrophone :size="20" weight="fill" />

      <!-- Recording pulse ring -->
      <span
        v-if="isRecording"
        class="absolute inset-0 rounded-full bg-destructive/30 animate-ping"
      />
    </button>
  </div>
</template>
