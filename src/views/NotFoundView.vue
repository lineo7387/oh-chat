<script setup lang="ts">
import { PhHouse } from '@phosphor-icons/vue'
import BlobBackground from '@/components/effects/BlobBackground.vue'
import Button from '@/components/ui/Button.vue'
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
    <BlobBackground
      :blobs="[
        {
          color: 'rgba(168, 84, 72, 0.05)',
          size: '400px',
          top: '15%',
          left: '15%',
          shape: 1,
          delay: 0,
        },
        {
          color: 'rgba(193, 140, 93, 0.05)',
          size: '350px',
          bottom: '10%',
          right: '20%',
          shape: 2,
          delay: -8,
        },
        {
          color: 'rgba(230, 220, 205, 0.08)',
          size: '380px',
          top: '55%',
          left: '55%',
          shape: 3,
          delay: -14,
        },
      ]"
    />

    <div class="relative z-10 max-w-md text-center">
      <div
        class="font-heading text-[8rem] font-extrabold leading-none text-primary/20 md:text-[10rem]"
      >
        404
      </div>

      <h1 class="mt-2 font-heading text-3xl font-bold text-foreground">Page not found</h1>

      <p class="mt-4 text-lg leading-relaxed text-muted-foreground">
        The page you are looking for seems to have wandered off into the wilderness.
      </p>

      <div class="mt-10">
        <RouterLink to="/">
          <Button size="lg">
            <PhHouse :size="20" weight="fill" />
            <span>Back Home</span>
          </Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
