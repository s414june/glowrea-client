import type { TagInfo } from '#shared/types/tag'
import { requireRequestCredentials } from '../../../utils/request-credentials'

export default defineEventHandler(async (event): Promise<TagInfo> => {
  const name = getRouterParam(event, 'name')
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing tag name.' })

  let authHeader: string | undefined
  let serverOrigin: string

  try {
    const creds = await requireRequestCredentials(event)
    authHeader = `Bearer ${creds.accessToken}`
    serverOrigin = creds.serverOrigin
  } catch {
    const runtimeConfig = useRuntimeConfig(event)
    const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
    if (!base) throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
    serverOrigin = base
  }

  const endpoint = new URL(`/api/v1/tags/${encodeURIComponent(name)}`, serverOrigin)
  const headers: Record<string, string> = {}
  if (authHeader) headers['Authorization'] = authHeader

  const response = await fetch(endpoint.toString(), { headers })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch tag info.' })
  }

  const raw = (await response.json()) as {
    name: string
    following: boolean
    history: { day: string; uses: string; accounts: string }[]
  }

  return {
    name: raw.name,
    following: raw.following ?? false,
    history: raw.history ?? [],
  }
})
