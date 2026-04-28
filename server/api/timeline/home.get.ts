import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'
import { requireRequestCredentials } from '../../utils/request-credentials'

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null
  }

  const links = linkHeader.split(',').map((segment) => segment.trim())
  const nextLink = links.find((segment) => segment.includes('rel="next"'))

  if (!nextLink) {
    return null
  }

  const urlMatch = nextLink.match(/<([^>]+)>/)
  if (!urlMatch || !urlMatch[1]) {
    return null
  }

  const nextUrl = new URL(urlMatch[1])
  return nextUrl.searchParams.get('max_id')
}

export default defineEventHandler(async (event): Promise<TimelinePageResponse> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const query = getQuery(event)
  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined
  const limit = 20
  const endpoint = new URL('/api/v1/timelines/home', serverOrigin)
  endpoint.searchParams.set('limit', String(limit))

  if (maxId) {
    endpoint.searchParams.set('max_id', maxId)
  }

  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch home timeline.'
    })
  }

  const items = (await response.json()) as TimelineStatus[]
  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link'))
  }
})