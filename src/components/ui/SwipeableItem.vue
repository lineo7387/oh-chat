<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { DragGesture } from '@use-gesture/vanilla'
import { PhPushPin, PhTrash } from '@phosphor-icons/vue'

const props = defineProps<{
  isPinned?: boolean
  itemId?: string
  activeId?: string | null
}>()

const emit = defineEmits<{
  pin: []
  delete: []
  open: []
}>()

const contentRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isDragging = ref(false)
const currentX = ref(0)
const ACTION_WIDTH = 96

const contentClass = computed(() => {
  return [
    'relative touch-pan-y select-none bg-card',
    !isDragging.value && 'transition-transform duration-300 ease-organic',
  ]
})

let gesture: InstanceType<typeof DragGesture> | null = null

// Close when another item becomes active
watch(
  () => props.activeId,
  (newId) => {
    if (newId !== props.itemId && isOpen.value) {
      close()
    }
  },
)

function close() {
  isOpen.value = false
  currentX.value = 0
}

function onContentClick(event: MouseEvent) {
  if (isOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
}

function handlePin() {
  emit('pin')
  close()
}

function handleDelete() {
  emit('delete')
  close()
}

onMounted(() => {
  if (!contentRef.value) return

  gesture = new DragGesture(
    contentRef.value,
    (state) => {
      const { movement, down, tap, canceled } = state
      if (canceled || tap) return

      isDragging.value = true

      const mx = movement[0] as number
      const baseOffset = isOpen.value ? -ACTION_WIDTH : 0
      let target = baseOffset + mx

      // Clamp
      if (target > 0) target = 0
      if (target < -ACTION_WIDTH) target = -ACTION_WIDTH

      currentX.value = target

      if (!down) {
        isDragging.value = false
        if (target <= -ACTION_WIDTH / 2) {
          isOpen.value = true
          currentX.value = -ACTION_WIDTH
          emit('open')
        } else {
          isOpen.value = false
          currentX.value = 0
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
    },
  )
})

onUnmounted(() => {
  gesture?.destroy()
})

defineExpose({ close })
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl">
    <!-- Actions layer -->
    <div
      class="absolute inset-y-0 right-0 flex items-center gap-1.5 px-2"
      :style="{ width: `${ACTION_WIDTH}px` }"
    >
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/90 text-white shadow-sm transition-all hover:bg-secondary hover:scale-105 active:scale-95"
        @click.stop="handlePin"
      >
        <PhPushPin :size="16" :weight="isPinned ? 'fill' : 'regular'" />
      </button>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/90 text-white shadow-sm transition-all hover:bg-destructive hover:scale-105 active:scale-95"
        @click.stop="handleDelete"
      >
        <PhTrash :size="16" weight="fill" />
      </button>
    </div>

    <!-- Content layer (draggable) -->
    <div
      ref="contentRef"
      :class="contentClass"
      :style="{ transform: `translateX(${currentX}px)` }"
      draggable="false"
      @dragstart.prevent
      @click="onContentClick"
    >
      <slot />
    </div>
  </div>
</template>
