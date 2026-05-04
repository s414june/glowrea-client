import type { AccountSummary } from '#shared/types/search'

export default defineEventHandler(async (event): Promise<AccountSummary[]> => {
  const runtimeConfig = useRuntimeConfig(event)
  const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase

  if (!base) {
    throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
  }

  // /api/v1/directory returns accounts ordered by recent activity (public endpoint)
  const endpoint = new URL('/api/v1/directory', base)
  endpoint.searchParams.set('order', 'active')
  endpoint.searchParams.set('local', 'false')
  endpoint.searchParams.set('limit', '20')

  const response = await fetch(endpoint.toString())

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch trending accounts.',
    })
  }

  // The directory API returns a slightly different shape; map to AccountSummary
  type DirectoryAccount = {
    id: string
    username: string
    acct: string
    display_name: string
    avatar: string
    url: string
    note: string
  }

  const raw = (await response.json()) as DirectoryAccount[]
  return raw.map((a) => ({
    id: a.id,
    username: a.username,
    acct: a.acct,
    displayName: a.display_name,
    avatar: a.avatar,
    url: a.url,
    note: a.note,
  }))
})
