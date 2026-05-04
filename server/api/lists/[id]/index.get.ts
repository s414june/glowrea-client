import type { ListItem } from '#shared/types/list'
import { requireRequestCredentials } from '../../../utils/request-credentials'

export default defineEventHandler(async (event): Promise<ListItem> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing list id.' })

  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const response = await fetch(new URL(`/api/v1/lists/${id}`, serverOrigin).toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to fetch list.' })
  }

  const raw = (await response.json()) as { id: string; title: string }
  return { id: raw.id, title: raw.title }
})
