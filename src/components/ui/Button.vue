<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'default',
  type: 'button',
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="
      cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold transition-all duration-200 ease-organic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        // Variants
        variant === 'primary' &&
          'bg-primary text-primary-foreground shadow-soft hover:shadow-hover hover:scale-105 active:scale-95',
        variant === 'secondary' &&
          'bg-secondary text-secondary-foreground shadow-float hover:shadow-hover hover:scale-105 active:scale-95',
        variant === 'outline' &&
          'border-2 border-secondary bg-transparent text-secondary hover:bg-secondary/10 active:scale-95',
        variant === 'ghost' &&
          'bg-transparent text-primary hover:bg-primary/10 active:scale-95',
        // Sizes
        size === 'sm' && 'h-10 px-6 text-sm',
        size === 'default' && 'h-12 px-8 text-base',
        size === 'lg' && 'h-14 px-10 text-lg',
      )
    "
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
