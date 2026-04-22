<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhEnvelope, PhLock, PhArrowRight } from '@phosphor-icons/vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleLogin() {
  error.value = ''
  const result = await authStore.signIn(email.value, password.value)
  if (!result.success) {
    error.value = 'Invalid email or password'
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="font-heading text-3xl font-bold text-foreground">
        Welcome back
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Sign in to continue your conversations
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <Input
        v-model="email"
        type="email"
        placeholder="Email address"
      >
        <template #prefix>
          <PhEnvelope :size="18" class="text-muted-foreground" />
        </template>
      </Input>

      <Input
        v-model="password"
        type="password"
        placeholder="Password"
      >
        <template #prefix>
          <PhLock :size="18" class="text-muted-foreground" />
        </template>
      </Input>

      <p v-if="error" class="text-center text-sm text-destructive">
        {{ error }}
      </p>

      <Button type="submit" class="w-full" :disabled="authStore.isLoading">
        <span>Sign In</span>
        <PhArrowRight :size="18" weight="bold" />
      </Button>
    </form>

    <div class="text-center text-sm">
      <RouterLink
        to="/login/forgot-password"
        class="text-primary transition-colors hover:underline"
      >
        Forgot password?
      </RouterLink>
    </div>

    <div class="border-t border-border/50 pt-4 text-center text-sm">
      <span class="text-muted-foreground">Don't have an account?</span>
      <RouterLink
        to="/login/register"
        class="ml-1 font-semibold text-primary transition-colors hover:underline"
      >
        Sign up
      </RouterLink>
    </div>
  </div>
</template>
