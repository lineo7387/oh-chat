import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export interface VoiceRecorderReturn {
  isRecording: Ref<boolean>
  duration: Ref<number>
  error: Ref<string | null>
  blob: Ref<Blob | null>
  isSupported: ComputedRef<boolean>
  startRecording: () => Promise<void>
  stopRecording: () => void
  cancelRecording: () => void
}

export function useVoiceRecorder(): VoiceRecorderReturn {
  const isRecording = ref(false)
  const duration = ref(0)
  const error = ref<string | null>(null)
  const blob = ref<Blob | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let stream: MediaStream | null = null

  const isSupported = computed(() => {
    return (
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof window.MediaRecorder !== 'undefined'
    )
  })

  async function startRecording() {
    error.value = null
    blob.value = null
    audioChunks = []

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (audioChunks.length > 0) {
          blob.value = new Blob(audioChunks, { type: 'audio/webm' })
        }
        cleanupStream()
      }

      mediaRecorder.onerror = () => {
        error.value = 'Recording error occurred'
        isRecording.value = false
        cleanup()
      }

      mediaRecorder.start(100)
      isRecording.value = true
      duration.value = 0

      timerInterval = setInterval(() => {
        duration.value++
        if (duration.value >= 60) {
          stopRecording()
        }
      }, 1000)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to access microphone'
      isRecording.value = false
      cleanup()
    }
  }

  function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return

    mediaRecorder.stop()
    isRecording.value = false

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function cancelRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      cleanup()
      return
    }

    mediaRecorder.stop()
    isRecording.value = false
    blob.value = null

    cleanup()
  }

  function cleanupStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }
    mediaRecorder = null
  }

  function cleanup() {
    cleanupStream()

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  return {
    isRecording,
    duration,
    error,
    blob,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
