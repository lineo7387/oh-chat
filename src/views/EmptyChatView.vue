<script setup lang="ts">
import { PhChatTeardropText } from '@phosphor-icons/vue'
import BlobBackground from '@/components/effects/BlobBackground.vue'
import Button from '@/components/ui/Button.vue'
</script>

<template>
  <div class="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
    <BlobBackground
      :blobs="[
        {
          color: 'rgba(93, 112, 82, 0.06)',
          size: '450px',
          top: '10%',
          left: '20%',
          shape: 1,
          delay: 0,
        },
        {
          color: 'rgba(193, 140, 93, 0.05)',
          size: '350px',
          bottom: '15%',
          right: '15%',
          shape: 2,
          delay: -7,
        },
        {
          color: 'rgba(230, 220, 205, 0.08)',
          size: '400px',
          top: '50%',
          left: '60%',
          shape: 3,
          delay: -12,
        },
      ]"
    />

    <div class="relative z-10 max-w-md text-center">
      <div
        class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 shadow-soft"
      >
        <PhChatTeardropText :size="40" weight="fill" class="text-primary" />
      </div>

      <h1 class="font-heading text-4xl font-bold text-foreground md:text-5xl">
        Welcome to oh-chat
      </h1>

      <p class="mt-4 text-lg leading-relaxed text-muted-foreground">
        A quiet space for meaningful conversations. Select a chat from the sidebar or start
        something new.
      </p>

      <div class="mt-10">
        <RouterLink to="/new-conversation">
          <Button size="lg">
            <span>Start a Conversation</span>
          </Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
