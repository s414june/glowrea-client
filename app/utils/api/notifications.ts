import type { NotificationsPageResponse } from '#shared/types/notification'

export async function fetchNotificationsPage(maxId?: string): Promise<NotificationsPageResponse> {
  return $fetch<NotificationsPageResponse>('/api/notifications', {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}
