import type { SearchResponse } from '#shared/types/search'

export async function fetchSearch(
  q: string,
  type?: 'accounts' | 'statuses' | 'hashtags',
): Promise<SearchResponse> {
  return $fetch<SearchResponse>('/api/search', {
    method: 'GET',
    query: { q, ...(type ? { type } : {}) },
  })
}
