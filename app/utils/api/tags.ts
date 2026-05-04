import type { TagInfo } from '#shared/types/tag'
import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchFollowedTags(): Promise<{ items: TagInfo[] }> {
  return $fetch<{ items: TagInfo[] }>('/api/tags/followed', { method: 'GET' })
}

export async function fetchTagInfo(name: string): Promise<TagInfo> {
  return $fetch<TagInfo>(`/api/tags/${encodeURIComponent(name)}`, { method: 'GET' })
}

export async function fetchTagTimeline(name: string, maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>(`/api/tags/${encodeURIComponent(name)}/timeline`, {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}

export async function followTag(name: string): Promise<TagInfo> {
  return $fetch<TagInfo>(`/api/tags/${encodeURIComponent(name)}/follow`, { method: 'POST' })
}

export async function unfollowTag(name: string): Promise<TagInfo> {
  return $fetch<TagInfo>(`/api/tags/${encodeURIComponent(name)}/follow`, { method: 'DELETE' })
}
