import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Conversation, Message } from '@/types'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)

  const currentConversation = ref<Conversation | null>(null)

  async function fetchConversations() {
    // TODO: implement with Supabase
    conversations.value = []
  }

  function setCurrentConversation(id: string | null) {
    currentConversationId.value = id
    currentConversation.value = conversations.value.find((c) => c.id === id) || null
  }

  async function sendMessage(content: string) {
    // TODO: implement with Supabase
    console.log('send message:', content)
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    isLoading,
    fetchConversations,
    setCurrentConversation,
    sendMessage,
  }
})
