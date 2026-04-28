import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'
import { requireAuthSession } from '../../../utils/auth-session'

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null

  const nextLink = linkHeader.split(',').map((s) => s.trim()).find((s) => s.includes('rel="next"'))
  if (!nextLink) return null

  const urlMatch = nextLink.match(/<([^>]+)>/)
  if (!urlMatch?.[1]) return null

  return new URL(urlMatch[1]).searchParams.get('max_id')
}

export default defineEventHandler(async (event): Promise<TimelinePageResponse> => {
  requireAuthSession(event)

  const runtimeConfig = useRuntimeConfig(event)
  const mastodonApiBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const mastodonToken = runtimeConfig.mastodonToken
  const query = getQuery(event)

  if (!mastodonApiBase) {
    throw createError({ statusCode: 500, statusMessage: 'Missing MASTODON_API_BASE configuration.' })
  }

  if (!mastodonToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing MASTODON_TOKEN configuration.' })
  }

  // First fetch the account id from verify_credentials
  const credResponse = await fetch(new URL('/api/v1/accounts/verify_credentials', mastodonApiBase).toString(), {
    headers: { Authorization: `Bearer ${mastodonToken}` }
  })

  if (!credResponse.ok) {
    throw createError({ statusCode: credResponse.status, statusMessage: 'Failed to resolve account id.' })
  }

  const cred = await credResponse.json() as { id: string }
  const accountId = cred.id

  const endpoint = new URL(`/api/v1/accounts/${accountId}/statuses`, mastodonApiBase)
  endpoint.searchParams.set('limit', '20')

  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined
  if (maxId) {
    endpoint.searchParams.set('max_id', maxId)
  }

  const response = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${mastodonToken}` }
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch profile statuses.' })
  }

  const items = (await response.json()) as TimelineStatus[]
  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link'))
  }
})
