<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhEnvelope, PhLock, PhUser, PhArrowRight } from '@phosphor-icons/vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

async function handleRegister() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  const result = await authStore.signUp(email.value, password.value, username.value)
  if (!result.success) {
    error.value = 'Registration failed. Please try again.'
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="font-heading text-3xl font-bold text-foreground">
        Create account
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Start chatting with friends today
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <Input
        v-model="username"
        placeholder="Username"
      >
        <template #prefix>
          <PhUser :size="18" class="text-muted-foreground" />
        </template>
      </Input>

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

      <Input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm password"
      >
        <template #prefix>
          <PhLock :size="18" class="text-muted-foreground" />
        </template>
      </Input>

      <p v-if="error" class="text-center text-sm text-destructive">
        {{ error }}
      </p>

      <Button type="submit" class="w-full" :disabled="authStore.isLoading">
        <span>Create Account</span>
        <PhArrowRight :size="18" weight="bold" />
      </Button>
    </form>

    <div class="border-t border-border/50 pt-4 text-center text-sm">
      <span class="text-muted-foreground">Already have an account?</span>
      <RouterLink
        to="/login"
        class="ml-1 font-semibold text-primary transition-colors hover:underline"
      >
        Sign in
      </RouterLink>
    </div>
  </div>
</template>
