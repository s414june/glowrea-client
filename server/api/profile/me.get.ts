import type { ProfileSummary } from '#shared/types/profile'
import { requireAuthSession } from '../../utils/auth-session'

type ProfileMeResponse = { profile: ProfileSummary }

export default defineEventHandler(async (event): Promise<ProfileMeResponse> => {
  requireAuthSession(event)

  const runtimeConfig = useRuntimeConfig(event)
  const mastodonApiBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const mastodonToken = runtimeConfig.mastodonToken

  if (!mastodonApiBase) {
    throw createError({ statusCode: 500, statusMessage: 'Missing MASTODON_API_BASE configuration.' })
  }

  if (!mastodonToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing MASTODON_TOKEN configuration.' })
  }

  const response = await fetch(new URL('/api/v1/accounts/verify_credentials', mastodonApiBase).toString(), {
    headers: { Authorization: `Bearer ${mastodonToken}` }
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch profile.' })
  }

  const raw = await response.json() as Record<string, unknown>
  const profile: ProfileSummary = {
    id: String(raw.id ?? ''),
    username: String(raw.username ?? ''),
    acct: String(raw.acct ?? ''),
    displayName: String(raw.display_name ?? ''),
    note: String(raw.note ?? ''),
    avatar: String(raw.avatar ?? ''),
    header: String(raw.header ?? ''),
    statusesCount: Number(raw.statuses_count ?? 0),
    followingCount: Number(raw.following_count ?? 0),
    followersCount: Number(raw.followers_count ?? 0)
  }

  return { profile }
})
