import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'

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
  const runtimeConfig = useRuntimeConfig(event)
  const mastodonApiBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase

  if (!mastodonApiBase) {
    throw createError({ statusCode: 500, statusMessage: 'Missing MASTODON_API_BASE configuration.' })
  }

  const query = getQuery(event)
  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined

  const endpoint = new URL('/api/v1/timelines/public', mastodonApiBase)
  endpoint.searchParams.set('local', 'true')
  endpoint.searchParams.set('limit', '20')
  if (maxId) {
    endpoint.searchParams.set('max_id', maxId)
  }

  const response = await fetch(endpoint.toString())

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch local timeline.' })
  }

  const items = (await response.json()) as TimelineStatus[]
  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link')),
  }
})
