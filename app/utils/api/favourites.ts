import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchFavouritesPage(maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>('/api/favourites', {
    method: 'GET',
    query: maxId ? { maxId } : undefined,
  })
}
