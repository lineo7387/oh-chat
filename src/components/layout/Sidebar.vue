<script setup lang="ts">
import { PhMagnifyingGlass, PhPlus, PhGear, PhX } from '@phosphor-icons/vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
    @click="close"
  />

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed z-50 flex h-full w-72 flex-col border-r border-border/30 bg-card/80 backdrop-blur-md transition-transform duration-300 ease-organic md:relative md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- User avatar header -->
    <div class="flex items-center gap-3 border-b border-border/30 p-4">
      <div class="h-10 w-10 overflow-hidden rounded-full bg-primary">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=default"
          alt="Avatar"
          class="h-full w-full object-cover"
        >
      </div>
      <div class="flex-1 min-w-0">
        <p class="truncate font-heading text-sm font-semibold text-foreground">
          Guest User
        </p>
        <p class="text-xs text-muted-foreground">
          Online
        </p>
      </div>
      <button
        class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted md:hidden"
        @click="close"
      >
        <PhX :size="18" />
      </button>
    </div>

    <!-- Search -->
    <div class="p-3">
      <div class="relative">
        <PhMagnifyingGlass
          :size="18"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search conversations..."
          class="h-10 w-full rounded-full border border-border bg-white/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
      </div>
    </div>

    <!-- Conversation list -->
    <div class="flex-1 overflow-y-auto px-2">
      <div class="py-2 text-center text-sm text-muted-foreground">
        No conversations yet
      </div>
    </div>

    <!-- Bottom actions -->
    <div class="flex items-center gap-2 border-t border-border/30 p-3">
      <RouterLink
        to="/new-conversation"
        class="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:scale-105 hover:shadow-hover active:scale-95"
        @click="close"
      >
        <PhPlus :size="18" weight="bold" />
        <span>New Chat</span>
      </RouterLink>
      <RouterLink
        to="/settings"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/50 text-foreground transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95"
        @click="close"
      >
        <PhGear :size="18" />
      </RouterLink>
    </div>
  </aside>
</template>
