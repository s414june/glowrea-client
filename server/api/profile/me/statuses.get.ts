import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'
import { requireRequestCredentials } from '../../../utils/request-credentials'

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null

  const nextLink = linkHeader
    .split(',')
    .map((s) => s.trim())
    .find((s) => s.includes('rel="next"'))
  if (!nextLink) return null

  const urlMatch = nextLink.match(/<([^>]+)>/)
  if (!urlMatch?.[1]) return null

  return new URL(urlMatch[1]).searchParams.get('max_id')
}

export default defineEventHandler(async (event): Promise<TimelinePageResponse> => {
  const { accessToken, serverOrigin, accountId } = await requireRequestCredentials(event)

  const query = getQuery(event)
  const endpoint = new URL(`/api/v1/accounts/${accountId}/statuses`, serverOrigin)
  endpoint.searchParams.set('limit', '20')

  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined
  if (maxId) endpoint.searchParams.set('max_id', maxId)

  if (query.excludeReplies === 'true') endpoint.searchParams.set('exclude_replies', 'true')
  if (query.onlyMedia === 'true') endpoint.searchParams.set('only_media', 'true')

  const response = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch profile statuses.' })
  }

  const items = (await response.json()) as TimelineStatus[]
  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link')),
  }
})
