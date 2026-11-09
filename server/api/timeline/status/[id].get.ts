import type { TimelineStatus } from '#shared/types/timeline'
import type { StatusDetail, StatusDetailResponse } from '#shared/types/status'
import { requireRequestCredentials } from '../../../utils/request-credentials'

function mapMediaAttachments(input: TimelineStatus): StatusDetail['mediaAttachments'] {
  if (!input.media_attachments?.length) {
    return []
  }

  return input.media_attachments.map((media) => ({
    id: media.id,
    type: media.type,
    url: media.url,
    previewUrl: media.preview_url,
    description: media.description ?? null
  }))
}

function mapStatus(input: TimelineStatus): StatusDetail {
  return {
    id: input.id,
    content: input.content,
    createdAt: input.created_at,
    mediaAttachments: mapMediaAttachments(input),
    account: {
      id: input.account.id,
      username: input.account.username,
      acct: input.account.acct,
      displayName: input.account.display_name,
      avatar: input.account.avatar
    },
    reblog: input.reblog ? mapStatus(input.reblog) : null
  }
}

export default defineEventHandler(async (event): Promise<StatusDetailResponse> => {
  const { accessToken, serverOrigin } = requireRequestCredentials(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing status id.'
    })
  }

  const endpoint = new URL(`/api/v1/statuses/${id}`, serverOrigin)
  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch status detail.'
    })
  }

  const item = (await response.json()) as TimelineStatus

  return {
    status: mapStatus(item)
  }
})
