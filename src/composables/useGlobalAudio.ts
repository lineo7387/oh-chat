import { ref } from 'vue'

const currentPlayingId = ref<string | null>(null)

export function useGlobalAudio() {
  function requestPlay(id: string) {
    currentPlayingId.value = id
  }

  function release(id: string) {
    if (currentPlayingId.value === id) {
      currentPlayingId.value = null
    }
  }

  return {
    currentPlayingId,
    requestPlay,
    release,
  }
}
