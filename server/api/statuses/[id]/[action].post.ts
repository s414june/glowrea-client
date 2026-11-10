import type { TimelineStatus } from '#shared/types/timeline'
import type { StatusActionResult } from '#shared/types/status'
import { requireRequestCredentials } from '../../../utils/request-credentials'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../../utils/mastodon-instance'

const actions = new Set(['favourite', 'unfavourite', 'reblog', 'unreblog', 'bookmark', 'unbookmark'])

export default defineEventHandler(async (event): Promise<StatusActionResult> => {
  const id = getRouterParam(event, 'id')
  const action = getRouterParam(event, 'action')
  if (!id || !/^[\w-]+$/.test(id)) throw createError({ statusCode: 400, statusMessage: '貼文 ID 無效。' })
  if (!action || !actions.has(action)) throw createError({ statusCode: 400, statusMessage: '不支援這個貼文操作。' })

  const credentials = await requireRequestCredentials(event)
  const requestedInstance = getQuery(event).instance
  if (typeof requestedInstance === 'string') {
    const instance = normalizeMastodonInstance(requestedInstance)
    const config = useRuntimeConfig(event)
    const configuredBase = config.mastodonApiBase || config.public.mastodonApiBase
    if (!instance || !(await isSupportedMastodonInstance(instance.hostname, configuredBase))) {
      throw createError({ statusCode: 400, statusMessage: '不支援這個 Mastodon 社群。' })
    }
    if (instance.origin !== credentials.serverOrigin) {
      throw createError({ statusCode: 409, statusMessage: '請先登入這篇貼文所屬的社群。' })
    }
  }

  const response = await fetch(new URL(`/api/v1/statuses/${encodeURIComponent(id)}/${action}`, credentials.serverOrigin), {
    method: 'POST',
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || '貼文操作失敗。' })
  }

  let status: Partial<TimelineStatus> = {}
  try {
    status = await response.json() as TimelineStatus
  } catch {
    // Some compatible servers may return an empty success response.
  }

  return {
    favouritesCount: status.favourites_count,
    reblogsCount: status.reblogs_count,
    favourited: status.favourited,
    reblogged: status.reblogged,
    bookmarked: status.bookmarked,
  }
})
