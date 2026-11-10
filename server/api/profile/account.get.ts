import type { ProfileSummary } from '#shared/types/profile'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../utils/mastodon-instance'
import { getOptionalRequestCredentials } from '../../utils/request-credentials'

export default defineEventHandler(async (event): Promise<{ profile: ProfileSummary }> => {
  const query = getQuery(event)
  const instanceInput = typeof query.instance === 'string' ? query.instance : ''
  const accountInput = typeof query.account === 'string' ? query.account.trim() : ''
  const instance = normalizeMastodonInstance(instanceInput)
  const account = accountInput.replace(/^@/, '')

  if (!instance || !account || account.length > 255 || /[/?#]/.test(account)) {
    throw createError({ statusCode: 400, statusMessage: '請提供有效的社群與帳號。' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  if (!await isSupportedMastodonInstance(instance.hostname, configuredBase)) {
    throw createError({ statusCode: 400, statusMessage: '不支援這個 Mastodon 社群。' })
  }

  const endpoint = new URL('/api/v1/accounts/lookup', instance.origin)
  endpoint.searchParams.set('acct', account)
  const credentials = getOptionalRequestCredentials(event)
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (credentials?.serverOrigin === instance.origin) headers.Authorization = `Bearer ${credentials.accessToken}`
  const response = await fetch(endpoint.toString(), { headers })

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: '找不到這個 Mastodon 帳號。' })
  }

  const raw = await response.json() as Record<string, unknown>
  const profile: ProfileSummary = {
    id: String(raw.id ?? ''),
    username: String(raw.username ?? ''),
    acct: String(raw.acct ?? account),
    displayName: String(raw.display_name ?? ''),
    note: String(raw.note ?? ''),
    avatar: String(raw.avatar ?? ''),
    emojis: Array.isArray(raw.emojis) ? raw.emojis as ProfileSummary['emojis'] : [],
    header: String(raw.header ?? ''),
    statusesCount: Number(raw.statuses_count ?? 0),
    followingCount: Number(raw.following_count ?? 0),
    followersCount: Number(raw.followers_count ?? 0),
  }

  return { profile }
})
