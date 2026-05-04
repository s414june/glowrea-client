import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'
import { requireRequestCredentials } from '../../utils/request-credentials'

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null

  const links = linkHeader.split(',').map((s) => s.trim())
  const nextLink = links.find((s) => s.includes('rel="next"'))
  if (!nextLink) return null

  const urlMatch = nextLink.match(/<([^>]+)>/)
  if (!urlMatch?.[1]) return null

  const nextUrl = new URL(urlMatch[1])
  return nextUrl.searchParams.get('max_id')
}

export default defineEventHandler(async (event): Promise<TimelinePageResponse> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const query = getQuery(event)
  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined

  const endpoint = new URL('/api/v1/favourites', serverOrigin)
  endpoint.searchParams.set('limit', '20')
  if (maxId) endpoint.searchParams.set('max_id', maxId)

  const response = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch favourites.',
    })
  }

  const items = (await response.json()) as TimelineStatus[]
  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link')),
  }
})
