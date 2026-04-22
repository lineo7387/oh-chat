<script setup lang="ts">
import { useRoute } from 'vue-router'
import { PhArrowLeft, PhChatCircleDots } from '@phosphor-icons/vue'
import Avatar from '@/components/ui/Avatar.vue'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const _userId = route.params.userId as string
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border/30 px-4 py-3">
      <RouterLink
        to="/contacts"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
      >
        <PhArrowLeft :size="22" class="text-foreground" />
      </RouterLink>
      <h1 class="font-heading text-lg font-semibold text-foreground">Profile</h1>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-8">
      <div class="mx-auto max-w-md text-center">
        <Avatar size="lg" alt="User" status="online" class="mx-auto h-24 w-24" />

        <h2 class="mt-4 font-heading text-2xl font-bold text-foreground">User Name</h2>
        <p class="mt-1 text-sm text-muted-foreground">@username</p>

        <p class="mt-4 text-foreground/80">
          This is a placeholder bio. User profile details will be displayed here.
        </p>

        <div class="mt-6 flex items-center justify-center gap-3">
          <RouterLink to="/chat/new">
            <Button>
              <PhChatCircleDots :size="18" weight="fill" />
              <span>Message</span>
            </Button>
          </RouterLink>
        </div>

        <!-- Info cards -->
        <div class="mt-8 space-y-3 text-left">
          <div class="rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
            <p class="mt-1 text-sm text-foreground">user@example.com</p>
          </div>
          <div class="rounded-[1.5rem] border border-border/50 bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member Since
            </p>
            <p class="mt-1 text-sm text-foreground">April 2025</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
