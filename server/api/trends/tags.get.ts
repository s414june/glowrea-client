import type { HashtagItem } from '#shared/types/search'

export default defineEventHandler(async (event): Promise<HashtagItem[]> => {
  const runtimeConfig = useRuntimeConfig(event)
  const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase

  if (!base) {
    throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
  }

  const endpoint = new URL('/api/v1/trends/tags', base)
  endpoint.searchParams.set('limit', '20')

  const response = await fetch(endpoint.toString())

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch trending tags.',
    })
  }

  return (await response.json()) as HashtagItem[]
})
