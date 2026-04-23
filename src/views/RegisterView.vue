<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhEnvelope, PhLock, PhUser, PhArrowRight, PhCheckCircle } from '@phosphor-icons/vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref('')
const showEmailConfirmation = ref(false)

async function handleRegister() {
  authStore.clearError()
  localError.value = ''

  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    localError.value = 'Password must be at least 6 characters'
    return
  }

  const result = await authStore.signUp(email.value, password.value, username.value)
  if (!result.success) return

  if (result.needsEmailConfirmation) {
    showEmailConfirmation.value = true
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Registration form -->
    <template v-if="!showEmailConfirmation">
      <div class="text-center">
        <h1 class="font-heading text-3xl font-bold text-foreground">Create account</h1>
        <p class="mt-2 text-sm text-muted-foreground">Start chatting with friends today</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <Input v-model="username" placeholder="Username" required>
          <template #prefix>
            <PhUser :size="18" class="text-muted-foreground" />
          </template>
        </Input>

        <Input v-model="email" type="email" placeholder="Email address" required>
          <template #prefix>
            <PhEnvelope :size="18" class="text-muted-foreground" />
          </template>
        </Input>

        <Input v-model="password" type="password" placeholder="Password" required minlength="6">
          <template #prefix>
            <PhLock :size="18" class="text-muted-foreground" />
          </template>
        </Input>

        <Input v-model="confirmPassword" type="password" placeholder="Confirm password" required>
          <template #prefix>
            <PhLock :size="18" class="text-muted-foreground" />
          </template>
        </Input>

        <p v-if="localError || authStore.authError" class="text-center text-sm text-destructive">
          {{ localError || authStore.authError }}
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
    </template>

    <!-- Email confirmation state -->
    <div v-else class="space-y-6 text-center">
      <PhCheckCircle :size="64" class="mx-auto text-primary" weight="fill" />
      <h1 class="font-heading text-2xl font-bold text-foreground">Check your email</h1>
      <p class="text-muted-foreground">
        We've sent a confirmation link to <strong class="text-foreground">{{ email }}</strong
        >.<br />
        Click the link to activate your account, then sign in.
      </p>
      <RouterLink to="/login">
        <Button variant="primary">
          <span>Go to Sign In</span>
        </Button>
      </RouterLink>
    </div>
  </div>
</template>
