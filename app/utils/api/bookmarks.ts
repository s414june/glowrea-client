import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchBookmarksPage(maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>('/api/bookmarks', {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}
