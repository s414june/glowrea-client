import type { ProfileMeResponse } from '#shared/types/profile'
import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  return $fetch<ProfileMeResponse>('/api/profile/me', { method: 'GET' })
}

export async function fetchProfileStatuses(options?: {
  maxId?: string
  excludeReplies?: boolean
  onlyMedia?: boolean
}): Promise<TimelinePageResponse> {
  const query: Record<string, string> = {}
  if (options?.maxId) query.maxId = options.maxId
  if (options?.excludeReplies) query.excludeReplies = 'true'
  if (options?.onlyMedia) query.onlyMedia = 'true'
  return $fetch<TimelinePageResponse>('/api/profile/me/statuses', {
    method: 'GET',
    query: Object.keys(query).length ? query : undefined,
  })
}
