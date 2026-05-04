import type { TimelineStatus } from '#shared/types/timeline'
import type { NotificationItem, NotificationsPageResponse } from '#shared/types/notification'
import { requireRequestCredentials } from '../../utils/request-credentials'

type RawNotificationAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
  url: string
}

type RawNotification = {
  id: string
  type: string
  created_at: string
  account: RawNotificationAccount
  status?: TimelineStatus
}

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null

  const links = linkHeader.split(',').map((s) => s.trim())
  const nextLink = links.find((s) => s.includes('rel="next"'))
  if (!nextLink) return null

  const urlMatch = nextLink.match(/<([^>]+)>/)
  if (!urlMatch?.[1]) return null

  const nextUrl = new URL(urlMatch[1])
  return nextUrl.searchParams.get('max_id')
}

function normalizeNotification(raw: RawNotification): NotificationItem | null {
  const validTypes = ['mention', 'favourite', 'reblog', 'follow'] as const
  if (!validTypes.includes(raw.type as (typeof validTypes)[number])) return null

  return {
    id: raw.id,
    type: raw.type as NotificationItem['type'],
    createdAt: raw.created_at,
    account: {
      id: raw.account.id,
      username: raw.account.username,
      acct: raw.account.acct,
      displayName: raw.account.display_name,
      avatar: raw.account.avatar,
      url: raw.account.url,
    },
    status: raw.status,
  }
}

export default defineEventHandler(async (event): Promise<NotificationsPageResponse> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const query = getQuery(event)
  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined

  const endpoint = new URL('/api/v1/notifications', serverOrigin)
  endpoint.searchParams.set('limit', '20')
  if (maxId) endpoint.searchParams.set('max_id', maxId)

  const response = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch notifications.',
    })
  }

  const raw = (await response.json()) as RawNotification[]
  const items = raw.map(normalizeNotification).filter((n): n is NotificationItem => n !== null)

  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link')),
  }
})
