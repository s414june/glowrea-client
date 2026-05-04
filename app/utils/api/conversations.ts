import type { ConversationsPageResponse } from '#shared/types/conversation'

export async function fetchConversationsPage(maxId?: string): Promise<ConversationsPageResponse> {
  return $fetch<ConversationsPageResponse>('/api/conversations', {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}
