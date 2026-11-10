import type { ProfileMeResponse } from '#shared/types/profile'
import type { TimelinePageResponse } from '#shared/types/timeline'

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  return $fetch<ProfileMeResponse>('/api/profile/me', { method: 'GET' })
}

export async function fetchAccountProfile(instance: string, account: string): Promise<ProfileMeResponse> {
  return $fetch<ProfileMeResponse>('/api/profile/account', {
    method: 'GET',
    query: { instance, account },
  })
}

export async function fetchProfileStatuses(options?: {
  maxId?: string
  excludeReplies?: boolean
  onlyMedia?: boolean
  pinned?: boolean
}): Promise<TimelinePageResponse> {
  const query: Record<string, string> = {}
  if (options?.maxId) query.maxId = options.maxId
  if (options?.excludeReplies) query.excludeReplies = 'true'
  if (options?.onlyMedia) query.onlyMedia = 'true'
  if (options?.pinned) query.pinned = 'true'
  return $fetch<TimelinePageResponse>('/api/profile/me/statuses', {
    method: 'GET',
    query: Object.keys(query).length ? query : undefined,
  })
}

export async function fetchAccountStatuses(instance: string, accountId: string, options?: {
  maxId?: string
  excludeReplies?: boolean
  onlyMedia?: boolean
  pinned?: boolean
}): Promise<TimelinePageResponse> {
  const query: Record<string, string> = { instance, accountId }
  if (options?.maxId) query.maxId = options.maxId
  if (options?.excludeReplies) query.excludeReplies = 'true'
  if (options?.onlyMedia) query.onlyMedia = 'true'
  if (options?.pinned) query.pinned = 'true'
  return $fetch<TimelinePageResponse>('/api/profile/account/statuses', {
    method: 'GET',
    query,
  })
}
