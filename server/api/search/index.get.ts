import type { TimelineStatus } from '#shared/types/timeline'
import type { AccountSummary, HashtagItem, SearchResponse } from '#shared/types/search'
import { requireRequestCredentials } from '../../utils/request-credentials'

type RawAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
  url: string
  note: string
}

type RawSearchResponse = {
  accounts: RawAccount[]
  statuses: TimelineStatus[]
  hashtags: HashtagItem[]
}

function normalizeAccount(raw: RawAccount): AccountSummary {
  return {
    id: raw.id,
    username: raw.username,
    acct: raw.acct,
    displayName: raw.display_name,
    avatar: raw.avatar,
    url: raw.url,
    note: raw.note,
  }
}

export default defineEventHandler(async (event): Promise<SearchResponse> => {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'Query parameter "q" is required.' })
  }

  const type = typeof query.type === 'string' ? query.type : undefined
  const limit = 20

  // Try to get credentials — guests proceed without auth
  let authHeader: string | undefined
  let serverOrigin: string

  try {
    const creds = await requireRequestCredentials(event)
    authHeader = `Bearer ${creds.accessToken}`
    serverOrigin = creds.serverOrigin
  } catch {
    const runtimeConfig = useRuntimeConfig(event)
    const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
    if (!base) throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
    serverOrigin = base
  }

  const endpoint = new URL('/api/v2/search', serverOrigin)
  endpoint.searchParams.set('q', q)
  endpoint.searchParams.set('limit', String(limit))
  if (type) endpoint.searchParams.set('type', type)

  const headers: Record<string, string> = {}
  if (authHeader) headers['Authorization'] = authHeader

  const response = await fetch(endpoint.toString(), { headers })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Search request failed.',
    })
  }

  const raw = (await response.json()) as RawSearchResponse
  return {
    accounts: raw.accounts.map(normalizeAccount),
    statuses: raw.statuses,
    hashtags: raw.hashtags,
  }
})
