<script setup lang="ts">
import { computed } from 'vue'
import { PhUser } from '@phosphor-icons/vue'
import { cn } from '@/lib/utils'

interface Props {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'away' | null
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  size: 'md',
  status: null,
})

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

const statusColor = computed(() => {
  switch (props.status) {
    case 'online':
      return 'bg-emerald-500'
    case 'away':
      return 'bg-amber-500'
    case 'offline':
      return 'bg-muted-foreground'
    default:
      return ''
  }
})

const fallbackLetter = computed(() => {
  return props.alt?.charAt(0).toUpperCase() || ''
})
</script>

<template>
  <div :class="cn('relative inline-flex shrink-0', props.class)">
    <div :class="cn('overflow-hidden rounded-full bg-primary/10', sizeClasses[size])">
      <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
      <div
        v-else-if="fallbackLetter"
        class="flex h-full w-full items-center justify-center font-heading font-bold text-primary"
        :class="size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'"
      >
        {{ fallbackLetter }}
      </div>
      <div v-else class="flex h-full w-full items-center justify-center text-primary">
        <PhUser :size="size === 'lg' ? 28 : size === 'md' ? 20 : 16" weight="fill" />
      </div>
    </div>
    <span
      v-if="status"
      :class="
        cn(
          'absolute bottom-0 right-0 block rounded-full border-2 border-card ring-1 ring-border/30',
          size === 'lg' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5',
          statusColor,
        )
      "
    />
  </div>
</template>
