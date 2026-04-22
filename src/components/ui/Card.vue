<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  corner?: 'default' | 'asymmetric-1' | 'asymmetric-2' | 'asymmetric-3'
}

const props = withDefaults(defineProps<Props>(), {
  corner: 'default',
})

const cornerClasses = {
  default: 'rounded-[2rem]',
  'asymmetric-1': 'rounded-[2rem_3rem_2rem_4rem]',
  'asymmetric-2': 'rounded-[3rem_2rem_4rem_2rem]',
  'asymmetric-3': 'rounded-[4rem_2rem_3rem_2rem]',
}
</script>

<template>
  <div
    :class="
      cn(
        'border border-[#DED8CF]/50 bg-card shadow-soft transition-all duration-300 ease-organic',
        cornerClasses[corner],
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
