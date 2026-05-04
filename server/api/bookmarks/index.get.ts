import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'
import { requireRequestCredentials } from '../../utils/request-credentials'

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const next = linkHeader.split(',').map(s => s.trim()).find(s => s.includes('rel="next"'))
  if (!next) return null
  const m = next.match(/<([^>]+)>/)
  if (!m?.[1]) return null
  return new URL(m[1]).searchParams.get('max_id')
}

export default defineEventHandler(async (event): Promise<TimelinePageResponse> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const query = getQuery(event)
  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined

  const endpoint = new URL('/api/v1/bookmarks', serverOrigin)
  endpoint.searchParams.set('limit', '20')
  if (maxId) endpoint.searchParams.set('max_id', maxId)

  const response = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch bookmarks.' })
  }

  const items = (await response.json()) as TimelineStatus[]
  return { items, nextMaxId: parseNextMaxId(response.headers.get('link')) }
})
