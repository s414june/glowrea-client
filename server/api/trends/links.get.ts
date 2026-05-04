import type { TrendingLink } from '#shared/types/search'

export default defineEventHandler(async (event): Promise<TrendingLink[]> => {
  const runtimeConfig = useRuntimeConfig(event)
  const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase

  if (!base) {
    throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
  }

  const endpoint = new URL('/api/v1/trends/links', base)
  endpoint.searchParams.set('limit', '20')

  const response = await fetch(endpoint.toString())

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch trending links.',
    })
  }

  type RawLink = {
    url: string
    title: string
    description: string
    type: string
    author_name?: string
    author_url?: string
    provider_name?: string
    provider_url?: string
    html?: string
    width?: number
    height?: number
    image?: string | null
    image_description?: string
    embed_url?: string
    blurhash?: string | null
    published_at?: string | null
    language?: string | null
    history?: { day: string; uses: string; accounts: string }[]
  }

  const raw = (await response.json()) as RawLink[]
  return raw.map((l) => ({
    url: l.url,
    title: l.title,
    description: l.description,
    image: l.image ?? null,
    authorName: l.author_name ?? null,
    providerName: l.provider_name ?? null,
    history: l.history ?? [],
  }))
})
