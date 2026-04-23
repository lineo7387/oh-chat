<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhArrowLeft,
  PhDotsThreeVertical,
  PhPaperPlaneRight,
  PhSmiley,
  PhPaperclip,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import Avatar from '@/components/ui/Avatar.vue'
import type { Profile } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()

const conversationId = ref(route.params.conversationId as string)
const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// Set current conversation and fetch messages
async function loadConversation(id: string) {
  chatStore.setCurrentConversation(id)
  await chatStore.fetchMessages(id)
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

// Watch route param changes (when switching conversations)
watch(
  () => route.params.conversationId as string,
  (newId) => {
    if (newId && newId !== conversationId.value) {
      conversationId.value = newId
      loadConversation(newId)
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (conversationId.value) {
    loadConversation(conversationId.value)
  }
})

async function sendMessage() {
  if (!messageText.value.trim()) return
  const content = messageText.value.trim()
  messageText.value = ''

  const result = await chatStore.sendMessage(content)
  if (result.success) {
    // Optimistically refetch messages; realtime will handle this eventually
    await chatStore.fetchMessages(conversationId.value)
    scrollToBottom()
  }
}

function isMyMessage(senderId: string | null): boolean {
  return senderId === authStore.user?.id
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const conversationName = ref('Loading...')
const conversationAvatar = ref<string | undefined>(undefined)
const conversationStatus = ref<Profile['status'] | undefined>(undefined)

watch(
  () => chatStore.currentConversation,
  (conv) => {
    if (conv) {
      conversationName.value = chatStore.getConversationName(conv)
      conversationAvatar.value = chatStore.getConversationAvatar(conv)
      conversationStatus.value = chatStore.getConversationStatus(conv)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border/30 px-4 py-3">
      <RouterLink
        to="/"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted md:hidden"
      >
        <PhArrowLeft :size="22" class="text-foreground" />
      </RouterLink>

      <Avatar
        size="md"
        :src="conversationAvatar"
        :alt="conversationName"
        :status="conversationStatus"
      />

      <div class="min-w-0 flex-1">
        <h2 class="truncate font-heading text-base font-semibold text-foreground">
          {{ conversationName }}
        </h2>
        <p class="text-xs text-muted-foreground">
          {{ conversationStatus ? `${conversationStatus}` : '' }}
        </p>
      </div>

      <button
        class="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
      >
        <PhDotsThreeVertical :size="22" class="text-foreground" />
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-6">
      <div
        v-if="chatStore.isLoading && chatStore.messages.length === 0"
        class="flex h-full items-center justify-center"
      >
        <div class="space-y-4 w-full max-w-md">
          <div
            v-for="i in 3"
            :key="i"
            class="flex animate-pulse gap-3"
            :class="i % 2 === 0 ? 'flex-row-reverse' : ''"
          >
            <div class="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <div class="h-12 w-48 rounded-2xl bg-muted/60" />
          </div>
        </div>
      </div>

      <div
        v-else-if="chatStore.messages.length === 0"
        class="flex h-full flex-col items-center justify-center text-center"
      >
        <p class="text-muted-foreground">No messages yet</p>
        <p class="mt-1 text-xs text-muted-foreground/60">Say hello to start the conversation</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="msg in chatStore.messages"
          :key="msg.id"
          :class="isMyMessage(msg.sender_id) ? 'flex justify-end' : 'flex justify-start'"
        >
          <div
            class="flex max-w-[80%] gap-2"
            :class="isMyMessage(msg.sender_id) ? 'flex-row-reverse' : ''"
          >
            <Avatar
              v-if="!isMyMessage(msg.sender_id) && msg.sender"
              size="sm"
              :src="msg.sender.avatar_url"
              :alt="msg.sender.display_name ?? msg.sender.username"
            />
            <div
              :class="[
                'rounded-[1.5rem] px-5 py-3 text-sm leading-relaxed',
                isMyMessage(msg.sender_id)
                  ? 'rounded-br-md bg-primary text-primary-foreground'
                  : 'rounded-bl-md bg-muted text-foreground',
              ]"
            >
              <p
                v-if="!isMyMessage(msg.sender_id) && msg.sender"
                class="mb-0.5 text-xs font-medium text-primary/70"
              >
                {{ msg.sender.display_name ?? msg.sender.username }}
              </p>
              <p>{{ msg.content }}</p>
              <p
                :class="[
                  'mt-1 text-right text-[10px]',
                  isMyMessage(msg.sender_id)
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground',
                ]"
              >
                {{ formatMessageTime(msg.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="border-t border-border/30 px-4 py-3">
      <div class="flex items-center gap-2 rounded-full border border-border bg-white/50 px-4 py-2">
        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PhPaperclip :size="20" />
        </button>

        <input
          v-model="messageText"
          type="text"
          placeholder="Type a message..."
          class="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          @keydown.enter.prevent="sendMessage"
        />

        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PhSmiley :size="20" />
        </button>

        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
          :disabled="!messageText.trim()"
          @click="sendMessage"
        >
          <PhPaperPlaneRight :size="18" weight="fill" />
        </button>
      </div>
    </div>
  </div>
</template>
