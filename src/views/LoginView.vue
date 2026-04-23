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
