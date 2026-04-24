<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhEnvelope, PhLock, PhArrowRight } from '@phosphor-icons/vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) router.push('/')
  },
)

async function handleLogin() {
  authStore.clearError()
  const result = await authStore.signIn(email.value, password.value)
  if (result.success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="font-heading text-3xl font-bold text-foreground">Welcome back</h1>
      <p class="mt-2 text-sm text-muted-foreground">Sign in to continue your conversations</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <Input v-model="email" type="email" placeholder="Email address" required>
        <template #prefix>
          <PhEnvelope :size="18" class="text-muted-foreground" />
        </template>
      </Input>

      <Input v-model="password" type="password" placeholder="Password" required>
        <template #prefix>
          <PhLock :size="18" class="text-muted-foreground" />
        </template>
      </Input>

      <p v-if="authStore.authError" class="text-center text-sm text-destructive">
        {{ authStore.authError }}
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

    <div class="relative flex items-center py-2">
      <div class="flex-1 border-t border-border/50"></div>
      <span class="mx-3 text-xs text-muted-foreground">or continue with</span>
      <div class="flex-1 border-t border-border/50"></div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        :disabled="authStore.isLoading"
        @click="authStore.signInWithOAuth('google')"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Google</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        :disabled="authStore.isLoading"
        @click="authStore.signInWithOAuth('github')"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
            fill="currentColor"
          />
        </svg>
        <span>GitHub</span>
      </Button>
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
