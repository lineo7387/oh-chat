<script setup lang="ts">
import { ref } from 'vue'
import { PhUser, PhShield, PhPalette } from '@phosphor-icons/vue'

type TabId = 'profile' | 'account' | 'appearance'

const activeTab = ref<TabId>('profile')

const tabs = [
  { id: 'profile' as TabId, label: 'Profile', icon: PhUser },
  { id: 'account' as TabId, label: 'Account', icon: PhShield },
  { id: 'appearance' as TabId, label: 'Appearance', icon: PhPalette },
]
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="border-b border-border/30 px-6 py-4">
      <h1 class="font-heading text-2xl font-bold text-foreground">Settings</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Manage your profile, account, and preferences
      </p>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar tabs -->
      <nav class="w-56 shrink-0 border-r border-border/30 p-4">
        <div class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ]"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="18" weight="fill" />
            {{ tab.label }}
          </button>
        </div>
      </nav>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-8">
        <!-- Profile -->
        <div v-if="activeTab === 'profile'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Profile</h2>
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <p class="text-muted-foreground">
              Profile settings will be available here. Edit your display name, avatar, and bio.
            </p>
          </div>
        </div>

        <!-- Account -->
        <div v-if="activeTab === 'account'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Account</h2>
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <p class="text-muted-foreground">
              Account settings will be available here. Change password, manage sessions, and
              security preferences.
            </p>
          </div>
        </div>

        <!-- Appearance -->
        <div v-if="activeTab === 'appearance'" class="max-w-lg space-y-6">
          <h2 class="font-heading text-xl font-semibold text-foreground">Appearance</h2>
          <div class="rounded-[2rem] border border-border/50 bg-card p-6 shadow-soft">
            <p class="text-muted-foreground">
              Appearance settings will be available here. Customize themes, font sizes, and display
              preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
