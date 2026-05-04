import type { TagInfo } from '#shared/types/tag'
import { requireRequestCredentials } from '../../utils/request-credentials'

export default defineEventHandler(async (event): Promise<{ items: TagInfo[] }> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const response = await fetch(new URL('/api/v1/followed_tags', serverOrigin).toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch followed tags.' })
  }

  const raw = (await response.json()) as { name: string; following: boolean; history: { day: string; uses: string; accounts: string }[] }[]
  return {
    items: raw.map(t => ({ name: t.name, following: t.following ?? true, history: t.history ?? [] })),
  }
})
