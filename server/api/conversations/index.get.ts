import type { TimelineStatus } from '#shared/types/timeline'
import type { ConversationAccount, ConversationItem, ConversationsPageResponse } from '#shared/types/conversation'
import { requireRequestCredentials } from '../../utils/request-credentials'

type RawAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
}

type RawConversation = {
  id: string
  accounts: RawAccount[]
  last_status: TimelineStatus | null
  unread: boolean
}

function parseNextMaxId(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const links = linkHeader.split(',').map((s) => s.trim())
  const nextLink = links.find((s) => s.includes('rel="next"'))
  if (!nextLink) return null
  const urlMatch = nextLink.match(/<([^>]+)>/)
  if (!urlMatch?.[1]) return null
  return new URL(urlMatch[1]).searchParams.get('max_id')
}

function normalizeAccount(raw: RawAccount): ConversationAccount {
  return {
    id: raw.id,
    username: raw.username,
    acct: raw.acct,
    displayName: raw.display_name,
    avatar: raw.avatar,
  }
}

export default defineEventHandler(async (event): Promise<ConversationsPageResponse> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const query = getQuery(event)
  const maxId = typeof query.maxId === 'string' ? query.maxId : undefined

  const endpoint = new URL('/api/v1/conversations', serverOrigin)
  endpoint.searchParams.set('limit', '20')
  if (maxId) endpoint.searchParams.set('max_id', maxId)

  const response = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch conversations.',
    })
  }

  const raw = (await response.json()) as RawConversation[]
  const items: ConversationItem[] = raw.map((c) => ({
    id: c.id,
    accounts: c.accounts.map(normalizeAccount),
    lastStatus: c.last_status,
    unread: c.unread,
  }))

  return {
    items,
    nextMaxId: parseNextMaxId(response.headers.get('link')),
  }
})
