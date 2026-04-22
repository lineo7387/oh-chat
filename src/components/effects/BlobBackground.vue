<script setup lang="ts">
interface BlobProps {
  color: string
  size: string
  top?: string
  left?: string
  right?: string
  bottom?: string
  shape?: 1 | 2 | 3
  delay?: number
}

withDefaults(defineProps<{ blobs?: BlobProps[] }>(), {
  blobs: () => [
    {
      color: 'rgba(93, 112, 82, 0.12)',
      size: '400px',
      top: '-100px',
      left: '-100px',
      shape: 1,
      delay: 0,
    },
    {
      color: 'rgba(193, 140, 93, 0.10)',
      size: '350px',
      bottom: '-80px',
      right: '-80px',
      shape: 2,
      delay: -5,
    },
    {
      color: 'rgba(230, 220, 205, 0.15)',
      size: '300px',
      top: '40%',
      left: '60%',
      shape: 3,
      delay: -10,
    },
  ],
})

const shapeClasses = {
  1: 'organic-shape-1',
  2: 'organic-shape-2',
  3: 'organic-shape-3',
}
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      v-for="(blob, i) in blobs"
      :key="i"
      class="absolute blur-3xl"
      :class="[
        shapeClasses[blob.shape ?? 1],
        i % 2 === 0 ? 'animate-blob-float' : 'animate-blob-float-delayed',
      ]"
      :style="{
        width: blob.size,
        height: blob.size,
        backgroundColor: blob.color,
        top: blob.top,
        left: blob.left,
        right: blob.right,
        bottom: blob.bottom,
        animationDelay: `${blob.delay ?? 0}s`,
      }"
    />
  </div>
</template>
