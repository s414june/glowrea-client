import type { AccountSummary, HashtagItem, TrendingLink } from '#shared/types/search'
import type { TimelineStatus } from '#shared/types/timeline'

export async function fetchTrendingTags(): Promise<HashtagItem[]> {
  return $fetch<HashtagItem[]>('/api/trends/tags', { method: 'GET' })
}

export async function fetchTrendingStatuses(): Promise<TimelineStatus[]> {
  return $fetch<TimelineStatus[]>('/api/trends/statuses', { method: 'GET' })
}

export async function fetchTrendingAccounts(): Promise<AccountSummary[]> {
  return $fetch<AccountSummary[]>('/api/trends/accounts', { method: 'GET' })
}

export async function fetchTrendingLinks(): Promise<TrendingLink[]> {
  return $fetch<TrendingLink[]>('/api/trends/links', { method: 'GET' })
}
