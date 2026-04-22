<script setup lang="ts">
import { ref } from 'vue'
import { PhEnvelope, PhArrowLeft, PhPaperPlaneRight } from '@phosphor-icons/vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const email = ref('')
const submitted = ref(false)

function handleSubmit() {
  submitted.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="font-heading text-3xl font-bold text-foreground">Reset password</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link
      </p>
    </div>

    <div v-if="submitted" class="rounded-2xl bg-primary/10 p-6 text-center">
      <PhPaperPlaneRight :size="32" class="mx-auto mb-3 text-primary" />
      <p class="font-heading text-lg font-semibold text-foreground">Check your inbox</p>
      <p class="mt-1 text-sm text-muted-foreground">
        We've sent a password reset link to {{ email }}
      </p>
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <Input v-model="email" type="email" placeholder="Email address">
        <template #prefix>
          <PhEnvelope :size="18" class="text-muted-foreground" />
        </template>
      </Input>

      <Button type="submit" class="w-full">
        <span>Send Reset Link</span>
      </Button>
    </form>

    <div class="text-center text-sm">
      <RouterLink
        to="/login"
        class="inline-flex items-center gap-1 text-primary transition-colors hover:underline"
      >
        <PhArrowLeft :size="16" />
        <span>Back to sign in</span>
      </RouterLink>
    </div>
  </div>
</template>
