import { apiClient } from '../client'
import type { Conversation, ConversationMessage, PaginatedResponse } from '@/types'

export async function getConversation(conversationId: string): Promise<Conversation> {
  return apiClient(`/conversations/${conversationId}`)
}

export async function getConversationMessages(conversationId: string): Promise<PaginatedResponse<ConversationMessage>> {
  return apiClient(`/conversations/${conversationId}/messages`)
}

export async function sendMessage(conversationId: string, content: string): Promise<ConversationMessage> {
  return apiClient(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
