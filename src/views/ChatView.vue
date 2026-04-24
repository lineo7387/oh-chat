<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhArrowLeft,
  PhDotsThreeVertical,
  PhPaperPlaneRight,
  PhSmiley,
  PhPaperclip,
  PhX,
  PhFile,
  PhDownload,
  PhImage,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import Avatar from '@/components/ui/Avatar.vue'
import GroupInfoPanel from '@/components/chat/GroupInfoPanel.vue'
import type { Profile, Attachment } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

const showGroupPanel = ref(false)

const conversationId = ref(route.params.conversationId as string)
const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const isSending = ref(false)

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
      selectedFiles.value = []
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

// ── File handling ──────────────────────────────────────────

function triggerFileSelect() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds 10MB limit.`)
      continue
    }
    selectedFiles.value.push(file)
  }

  target.value = ''
}

function removeSelectedFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageAttachment(attachment: Attachment): boolean {
  return attachment.file_type.startsWith('image/')
}

function getAttachmentUrl(attachment: Attachment): string {
  return chatStore.getAttachmentUrl(attachment.storage_path)
}

// ── Send message ───────────────────────────────────────────

const canSend = computed(() => {
  return messageText.value.trim().length > 0 || selectedFiles.value.length > 0
})

async function sendMessage() {
  if (!canSend.value || isSending.value) return

  const content = messageText.value.trim()
  const files = selectedFiles.value.length > 0 ? [...selectedFiles.value] : undefined

  messageText.value = ''
  selectedFiles.value = []
  isSending.value = true

  const result = await chatStore.sendMessage(content, files)
  isSending.value = false

  if (result.success) {
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
          <template v-if="chatStore.currentConversation?.type === 'group'">
            {{ chatStore.currentConversation?.participants.length ?? 0 }} members
          </template>
          <template v-else>
            {{ conversationStatus ? `${conversationStatus}` : '' }}
          </template>
        </p>
      </div>

      <button
        v-if="chatStore.currentConversation?.type === 'group'"
        class="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
        @click="showGroupPanel = true"
      >
        <PhDotsThreeVertical :size="22" class="text-foreground" />
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-6">
      <div
        v-if="chatStore.isLoadingMessages && chatStore.messages.length === 0"
        class="flex h-full items-center justify-center"
      >
        <div class="w-full max-w-md space-y-4">
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

              <!-- Attachments -->
              <div v-if="msg.attachments && msg.attachments.length > 0" class="mb-2 space-y-2">
                <div v-for="attachment in msg.attachments" :key="attachment.id">
                  <!-- Image attachment -->
                  <div v-if="isImageAttachment(attachment)" class="overflow-hidden rounded-xl">
                    <img
                      :src="getAttachmentUrl(attachment)"
                      :alt="attachment.file_name"
                      class="max-h-60 max-w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <!-- File attachment -->
                  <a
                    v-else
                    :href="getAttachmentUrl(attachment)"
                    :download="attachment.file_name"
                    class="flex items-center gap-3 rounded-xl border border-border/50 bg-white/40 px-3 py-2.5 transition-colors hover:bg-white/70"
                    :class="isMyMessage(msg.sender_id) ? 'border-primary-foreground/20' : ''"
                  >
                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"
                    >
                      <PhFile :size="18" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">{{ attachment.file_name }}</p>
                      <p class="text-xs opacity-70">{{ formatFileSize(attachment.file_size) }}</p>
                    </div>
                    <PhDownload :size="16" class="shrink-0 opacity-70" />
                  </a>
                </div>
              </div>

              <!-- Message text -->
              <p v-if="msg.content">{{ msg.content }}</p>

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

    <!-- Selected files preview -->
    <div v-if="selectedFiles.length > 0" class="border-t border-border/30 bg-background px-4 py-2">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-1.5 text-sm"
        >
          <PhImage v-if="file.type.startsWith('image/')" :size="14" />
          <PhFile v-else :size="14" />
          <span class="max-w-[120px] truncate">{{ file.name }}</span>
          <span class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</span>
          <button
            class="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            @click="removeSelectedFile(index)"
          >
            <PhX :size="12" weight="bold" />
          </button>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="border-t border-border/30 px-4 py-3">
      <div class="flex items-center gap-2 rounded-full border border-border bg-white/50 px-4 py-2">
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
          @change="onFileSelected"
        />

        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="triggerFileSelect"
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
          :disabled="!canSend || isSending"
          @click="sendMessage"
        >
          <PhPaperPlaneRight :size="18" weight="fill" />
        </button>
      </div>
    </div>

    <!-- Group Info Panel -->
    <GroupInfoPanel
      :conversation="chatStore.currentConversation"
      :is-open="showGroupPanel"
      @close="showGroupPanel = false"
      @left="router.push('/')"
    />
  </div>
</template>
