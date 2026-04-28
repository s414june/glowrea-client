import type { ProfileMeResponse } from '#shared/types/profile'
import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  return $fetch<ProfileMeResponse>('/api/profile/me', { method: 'GET' })
}

export async function fetchProfileStatuses(maxId?: string): Promise<TimelinePageResponse> {
  return $fetch<TimelinePageResponse>('/api/profile/me/statuses', {
    method: 'GET',
    query: maxId ? { maxId } : undefined
  })
}
