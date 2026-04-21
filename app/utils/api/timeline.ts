import type { TimelinePageResponse } from '~/shared/types/timeline'

export async function fetchHomeTimelinePage(maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>('/api/timeline/home', {
    method: 'GET',
    query: maxId ? { maxId } : undefined
  })
}