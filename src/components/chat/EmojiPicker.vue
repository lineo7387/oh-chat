<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { PhMagnifyingGlass, PhClockCounterClockwise } from '@phosphor-icons/vue'
import {
  emojiCategories,
  getRecentEmojis,
  addRecentEmoji,
  searchEmojis,
  type EmojiCategory,
} from '@/data/emojis'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [emoji: string]
}>()

const pickerRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const activeCategory = ref('smileys')
const recentEmojis = ref<string[]>(getRecentEmojis())

// Close on click outside
onClickOutside(pickerRef, () => {
  if (props.modelValue) {
    emit('update:modelValue', false)
  }
})

const categoriesWithRecent = computed<
  (EmojiCategory | { id: string; name: string; emojis: string[] })[]
>(() => {
  const recent = recentEmojis.value
  if (recent.length > 0) {
    return [{ id: 'recent', name: 'Recent', emojis: recent }, ...emojiCategories]
  }
  return emojiCategories
})

const displayedEmojis = computed(() => {
  if (searchQuery.value.trim()) {
    const results = searchEmojis(searchQuery.value)
    return results.map((r) => r.emoji)
  }
  const cat = categoriesWithRecent.value.find((c) => c.id === activeCategory.value)
  return cat?.emojis ?? []
})

function selectEmoji(emoji: string) {
  addRecentEmoji(emoji)
  recentEmojis.value = getRecentEmojis()
  emit('select', emoji)
}

function setCategory(id: string) {
  activeCategory.value = id
  searchQuery.value = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      recentEmojis.value = getRecentEmojis()
      nextTick(() => {
        searchQuery.value = ''
        if (recentEmojis.value.length > 0) {
          activeCategory.value = 'recent'
        } else {
          activeCategory.value = 'smileys'
        }
      })
    }
  },
)
</script>

<template>
  <div
    v-if="modelValue"
    ref="pickerRef"
    class="absolute bottom-full right-0 z-50 mb-2 w-[320px] overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-soft max-sm:fixed max-sm:bottom-20 max-sm:left-2 max-sm:right-2 max-sm:w-auto max-sm:mb-0"
  >
    <!-- Search -->
    <div class="border-b border-border/50 px-3 py-2.5">
      <div
        class="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
      >
        <PhMagnifyingGlass :size="14" class="shrink-0 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search emoji..."
          class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>

    <!-- Category tabs -->
    <div
      v-if="!searchQuery.trim()"
      class="flex gap-1 overflow-x-auto border-b border-border/50 px-3 py-2 scrollbar-hide"
    >
      <button
        v-for="cat in categoriesWithRecent"
        :key="cat.id"
        :class="[
          'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
          activeCategory === cat.id
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="setCategory(cat.id)"
      >
        <template v-if="cat.id === 'recent'">
          <PhClockCounterClockwise :size="12" class="inline" />
        </template>
        <template v-else>
          {{ cat.name }}
        </template>
      </button>
    </div>

    <!-- Emoji grid -->
    <div class="max-h-[240px] overflow-y-auto px-2 py-2">
      <div
        v-if="displayedEmojis.length === 0"
        class="py-8 text-center text-sm text-muted-foreground"
      >
        No emojis found
      </div>
      <div v-else class="grid grid-cols-8 gap-1">
        <button
          v-for="emoji in displayedEmojis"
          :key="emoji"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-xl transition-all duration-150 hover:bg-muted hover:scale-110"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
