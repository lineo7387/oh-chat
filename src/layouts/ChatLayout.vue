<script setup lang="ts">
import { ref } from 'vue'
import { PhList } from '@phosphor-icons/vue'
import Sidebar from '@/components/layout/Sidebar.vue'

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Sidebar -->
    <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />

    <!-- Main content -->
    <main class="relative flex-1 overflow-hidden">
      <!-- Mobile header -->
      <div class="flex items-center gap-3 border-b border-border/30 px-4 py-3 md:hidden">
        <button
          class="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
          @click="toggleSidebar"
        >
          <PhList :size="24" class="text-foreground" />
        </button>
      </div>

      <RouterView />
    </main>
  </div>
</template>
