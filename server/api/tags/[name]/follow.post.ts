import type { TagInfo } from '#shared/types/tag'
import { requireRequestCredentials } from '../../../utils/request-credentials'

export default defineEventHandler(async (event): Promise<TagInfo> => {
  const name = getRouterParam(event, 'name')
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing tag name.' })

  const { accessToken, serverOrigin } = await requireRequestCredentials(event)

  const response = await fetch(new URL(`/api/v1/tags/${encodeURIComponent(name)}/follow`, serverOrigin).toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({ statusCode: response.status, statusMessage: detail || 'Failed to follow tag.' })
  }

  const raw = (await response.json()) as {
    name: string
    following: boolean
    history: { day: string; uses: string; accounts: string }[]
  }

  return { name: raw.name, following: raw.following ?? true, history: raw.history ?? [] }
})
