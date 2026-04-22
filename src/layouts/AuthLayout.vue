<script setup lang="ts">
import BlobBackground from '@/components/effects/BlobBackground.vue'
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center px-4">
    <BlobBackground
      :blobs="[
        {
          color: 'rgba(93, 112, 82, 0.08)',
          size: '500px',
          top: '-150px',
          left: '-150px',
          shape: 1,
        },
        {
          color: 'rgba(193, 140, 93, 0.06)',
          size: '400px',
          bottom: '-100px',
          right: '-100px',
          shape: 2,
        },
      ]"
    />

    <div class="relative z-10 w-full max-w-md">
      <div class="rounded-[2rem] border border-[#DED8CF]/50 bg-card p-8 shadow-soft">
        <RouterView />
      </div>
    </div>
  </div>
</template>
