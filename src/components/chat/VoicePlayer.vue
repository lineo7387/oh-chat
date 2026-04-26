<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { PhPlay, PhPause } from '@phosphor-icons/vue'
import { useGlobalAudio } from '@/composables/useGlobalAudio'

const props = defineProps<{
  id: string
  src: string
  duration: number
}>()

const { currentPlayingId, requestPlay, release } = useGlobalAudio()

const audio = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const hasMetadata = ref(false)

// When another VoicePlayer starts playing, pause this one
watch(currentPlayingId, (newId) => {
  if (newId !== props.id && isPlaying.value && audio.value) {
    audio.value.pause()
  }
})

const progressPercent = computed(() => {
  if (props.duration <= 0) return 0
  return (currentTime.value / props.duration) * 100
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function togglePlay() {
  if (!audio.value) {
    console.error('[VoicePlayer] audio ref is null')
    return
  }

  if (!props.src) {
    console.error('[VoicePlayer] src is empty')
    loadError.value = 'Audio unavailable'
    return
  }

  if (isPlaying.value) {
    audio.value.pause()
    return
  }

  // Clear any previous error and ensure audio is loaded before playing
  loadError.value = null
  if (audio.value.readyState < HTMLMediaElement.HAVE_METADATA) {
    audio.value.load()
  }

  isLoading.value = true
  try {
    await audio.value.play()
  } catch (err) {
    isLoading.value = false
    console.error('[VoicePlayer] play() failed:', err)
    loadError.value = err instanceof Error ? err.message : 'Playback failed'
  }
}

function onTimeUpdate() {
  if (!audio.value) return
  currentTime.value = audio.value.currentTime
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
  release(props.id)
}

function onPlay() {
  isPlaying.value = true
  isLoading.value = false
  loadError.value = null
  requestPlay(props.id)
}

function onPause() {
  isPlaying.value = false
  release(props.id)
}

function onLoadedMetadata() {
  hasMetadata.value = true
  if (audio.value && audio.value.duration && !Number.isNaN(audio.value.duration)) {
    // Use actual duration if available and prop is 0 or fallback
    if (props.duration <= 0) {
      // Can't update prop, but currentTime tracking will work
    }
  }
}

function onAudioError() {
  isLoading.value = false
  isPlaying.value = false
  const err = audio.value?.error
  const code = err?.code ?? 'unknown'
  const msg = err?.message ?? 'Unknown error'
  console.error(`[VoicePlayer] audio error (code: ${code}):`, msg, '| src:', props.src)
  loadError.value = `Load failed (${code})`
}

onUnmounted(() => {
  release(props.id)
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
  }
})
</script>

<template>
  <div class="flex items-center gap-2.5 min-w-[160px]">
    <button
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
      :class="[isPlaying ? 'bg-white/40' : 'bg-white/20', isLoading && 'animate-pulse']"
      :disabled="isLoading"
      @click="togglePlay"
    >
      <template v-if="isLoading">
        <div
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      </template>
      <template v-else>
        <PhPlay v-if="!isPlaying" :size="16" weight="fill" />
        <PhPause v-else :size="16" weight="fill" />
      </template>
    </button>

    <div class="flex flex-1 flex-col gap-1">
      <div v-if="loadError" class="text-[11px] text-current/70">
        {{ loadError }}
      </div>
      <div v-else class="flex items-center gap-1.5">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-current/20">
          <div
            class="h-full rounded-full bg-current transition-[width] duration-100"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>
    </div>

    <span class="shrink-0 text-[11px] tabular-nums opacity-80">
      {{ formatTime(isPlaying ? currentTime : duration) }}
    </span>

    <audio
      ref="audio"
      :src="src"
      preload="none"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @play="onPlay"
      @pause="onPause"
      @loadedmetadata="onLoadedMetadata"
      @error="onAudioError"
    />
  </div>
</template>
