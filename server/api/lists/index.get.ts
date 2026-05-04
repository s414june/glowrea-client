import type { ListsResponse } from '#shared/types/list'
import { requireRequestCredentials } from '../../utils/request-credentials'

export default defineEventHandler(async (event): Promise<ListsResponse> => {
  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const response = await fetch(new URL('/api/v1/lists', serverOrigin).toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch lists.' })
  }

  const raw = (await response.json()) as { id: string; title: string }[]
  return { items: raw.map(l => ({ id: l.id, title: l.title })) }
})
