import type { TimelineStatus } from '#shared/types/timeline'

export default defineEventHandler(async (event): Promise<TimelineStatus[]> => {
  const runtimeConfig = useRuntimeConfig(event)
  const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase

  if (!base) {
    throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
  }

  const endpoint = new URL('/api/v1/trends/statuses', base)
  endpoint.searchParams.set('limit', '20')

  const response = await fetch(endpoint.toString())

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch trending statuses.',
    })
  }

  return (await response.json()) as TimelineStatus[]
})
