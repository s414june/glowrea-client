import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchLocalTimelinePage(maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>('/api/timeline/local', {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}
