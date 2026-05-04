import type { ListItem, ListsResponse } from '#shared/types/list'
import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchLists(): Promise<ListsResponse> {
  return $fetch<ListsResponse>('/api/lists', { method: 'GET' })
}

export async function fetchListById(id: string): Promise<ListItem> {
  return $fetch<ListItem>(`/api/lists/${id}`, { method: 'GET' })
}

export async function fetchListTimeline(id: string, maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>(`/api/lists/${id}/timeline`, {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}
