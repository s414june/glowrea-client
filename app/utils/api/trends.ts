import type { HashtagItem } from '#shared/types/search'

export async function fetchTrendingTags(): Promise<HashtagItem[]> {
  return $fetch<HashtagItem[]>('/api/trends/tags', { method: 'GET' })
}
