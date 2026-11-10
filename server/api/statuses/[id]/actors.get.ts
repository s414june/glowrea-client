import type { StatusActor } from '#shared/types/status'
import { getOptionalRequestCredentials } from '../../../utils/request-credentials'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../../utils/mastodon-instance'

type MastodonAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
  emojis?: StatusActor['emojis']
}

export default defineEventHandler(async (event): Promise<StatusActor[]> => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[\w-]+$/.test(id)) throw createError({ statusCode: 400, statusMessage: '貼文 ID 無效。' })

  const query = getQuery(event)
  const type = query.type
  if (type !== 'favourited' && type !== 'reblogged') {
    throw createError({ statusCode: 400, statusMessage: '不支援這個人選清單。' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const credentials = getOptionalRequestCredentials(event)
  let serverOrigin = credentials?.serverOrigin || configuredBase

  if (typeof query.instance === 'string') {
    const instance = normalizeMastodonInstance(query.instance)
    if (!instance || !(await isSupportedMastodonInstance(instance.hostname, configuredBase))) {
      throw createError({ statusCode: 400, statusMessage: '不支援這個 Mastodon 社群。' })
    }
    serverOrigin = instance.origin
  }

  if (!serverOrigin) throw createError({ statusCode: 500, statusMessage: 'Mastodon API 尚未設定。' })

  const endpoint = new URL(`/api/v1/statuses/${encodeURIComponent(id)}/${type}_by`, serverOrigin)
  endpoint.searchParams.set('limit', '80')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (credentials?.serverOrigin === serverOrigin) headers.Authorization = `Bearer ${credentials.accessToken}`

  const response = await fetch(endpoint.toString(), { headers })
  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || '無法載入人選清單。' })
  }

  const accounts = await response.json() as MastodonAccount[]
  return accounts.map(account => ({
    id: account.id,
    username: account.username,
    acct: account.acct,
    displayName: account.display_name,
    avatar: account.avatar,
    emojis: account.emojis ?? [],
  }))
})
