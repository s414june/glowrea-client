import { requireRequestCredentials } from '../../../utils/request-credentials'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../../utils/mastodon-instance'

const reportCategories = new Set(['spam', 'violation', 'illegal', 'other'])

export default defineEventHandler(async (event): Promise<{ reported: true }> => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[\w-]+$/.test(id)) throw createError({ statusCode: 400, statusMessage: '貼文 ID 無效。' })

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

  const body = await readBody<{ accountId?: unknown; category?: unknown; comment?: unknown }>(event)
  const accountId = typeof body?.accountId === 'string' ? body.accountId.trim() : ''
  const category = typeof body?.category === 'string' ? body.category : 'other'
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 1000) : ''
  if (!accountId || accountId.length > 255 || !/^[\w-]+$/.test(accountId)) {
    throw createError({ statusCode: 400, statusMessage: '檢舉對象無效。' })
  }
  if (!reportCategories.has(category)) throw createError({ statusCode: 400, statusMessage: '檢舉原因無效。' })

  const response = await fetch(new URL('/api/v1/reports', credentials.serverOrigin), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ account_id: accountId, status_ids: [id], category, comment }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || '送出檢舉失敗。' })
  }
  return { reported: true }
})
