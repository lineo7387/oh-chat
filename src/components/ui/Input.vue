<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  id?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="w-full">
    <input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue"
      :class="
        cn(
          'h-12 w-full rounded-full border border-border bg-white/50 px-5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/30',
        )
      "
      @input="onInput"
    />
    <p v-if="error" class="mt-1.5 px-4 text-xs text-destructive">
      {{ error }}
    </p>
  </div>
</template>
