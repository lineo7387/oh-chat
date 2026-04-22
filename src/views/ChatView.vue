<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhArrowLeft,
  PhDotsThreeVertical,
  PhPaperPlaneRight,
  PhSmiley,
  PhPaperclip,
} from '@phosphor-icons/vue'
import Avatar from '@/components/ui/Avatar.vue'

const route = useRoute()
const _conversationId = route.params.conversationId as string

const messageText = ref('')
const messages = ref([
  { id: 1, content: 'Hey! How are you doing?', isMine: false, time: '10:30 AM' },
  {
    id: 2,
    content: "I'm doing great, thanks for asking! How about you?",
    isMine: true,
    time: '10:32 AM',
  },
  {
    id: 3,
    content: 'Pretty good. Just working on some new designs.',
    isMine: false,
    time: '10:33 AM',
  },
])

function sendMessage() {
  if (!messageText.value.trim()) return
  messages.value.push({
    id: Date.now(),
    content: messageText.value,
    isMine: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })
  messageText.value = ''
}
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

      <Avatar size="md" alt="Conversation" status="online" />

      <div class="min-w-0 flex-1">
        <h2 class="truncate font-heading text-base font-semibold text-foreground">Design Team</h2>
        <p class="text-xs text-muted-foreground">3 members online</p>
      </div>

      <button
        class="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
      >
        <PhDotsThreeVertical :size="22" class="text-foreground" />
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <div class="space-y-4">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="msg.isMine ? 'flex justify-end' : 'flex justify-start'"
        >
          <div
            :class="[
              'max-w-[75%] rounded-[1.5rem] px-5 py-3 text-sm leading-relaxed',
              msg.isMine
                ? 'rounded-br-md bg-primary text-primary-foreground'
                : 'rounded-bl-md bg-muted text-foreground',
            ]"
          >
            <p>{{ msg.content }}</p>
            <p
              :class="[
                'mt-1 text-right text-[10px]',
                msg.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground',
              ]"
            >
              {{ msg.time }}
            </p>
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
