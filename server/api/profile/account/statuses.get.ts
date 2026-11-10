import type { TimelinePageResponse, TimelineStatus } from '#shared/types/timeline'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../../utils/mastodon-instance'
import { getOptionalRequestCredentials } from '../../../utils/request-credentials'

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null

  const nextLink = linkHeader
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.includes('rel="next"'))
  const linkUrl = nextLink?.match(/<([^>]+)>/)?.[1]
  if (!linkUrl) return null

  return new URL(linkUrl).searchParams.get('max_id')
}

export default defineEventHandler(async (event): Promise<TimelinePageResponse> => {
  const query = getQuery(event)
  const instanceInput = typeof query.instance === 'string' ? query.instance : ''
  const accountId = typeof query.accountId === 'string' ? query.accountId : ''
  const instance = normalizeMastodonInstance(instanceInput)

  if (!instance || !accountId || accountId.length > 255 || !/^[\w-]+$/.test(accountId)) {
    throw createError({ statusCode: 400, statusMessage: '請提供有效的社群與帳號 ID。' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  if (!await isSupportedMastodonInstance(instance.hostname, configuredBase)) {
    throw createError({ statusCode: 400, statusMessage: '不支援這個 Mastodon 社群。' })
  }

  const endpoint = new URL(`/api/v1/accounts/${encodeURIComponent(accountId)}/statuses`, instance.origin)
  endpoint.searchParams.set('limit', '20')
  if (typeof query.maxId === 'string' && query.maxId) endpoint.searchParams.set('max_id', query.maxId)
  if (query.excludeReplies === 'true') endpoint.searchParams.set('exclude_replies', 'true')
  if (query.onlyMedia === 'true') endpoint.searchParams.set('only_media', 'true')
  if (query.pinned === 'true') endpoint.searchParams.set('pinned', 'true')

  const credentials = getOptionalRequestCredentials(event)
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (credentials?.serverOrigin === instance.origin) headers.Authorization = `Bearer ${credentials.accessToken}`
  const response = await fetch(endpoint.toString(), { headers })
  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: '無法載入這個帳號的貼文。' })
  }

  return {
    items: await response.json() as TimelineStatus[],
    nextMaxId: parseNextMaxId(response.headers.get('link')),
  }
})
