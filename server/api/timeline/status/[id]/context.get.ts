import type { TimelineStatus } from '#shared/types/timeline'
import type { StatusContextResponse, StatusDetail } from '#shared/types/status'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../../../utils/mastodon-instance'
import { getOptionalRequestCredentials, requireRequestCredentials } from '../../../../utils/request-credentials'

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
    url: input.url ?? null,
    uri: input.uri,
    content: input.content,
    createdAt: input.created_at,
    favouritesCount: input.favourites_count,
    reblogsCount: input.reblogs_count,
    repliesCount: input.replies_count,
    favourited: input.favourited,
    reblogged: input.reblogged,
    bookmarked: input.bookmarked,
    emojis: input.emojis,
    mediaAttachments: mapMediaAttachments(input),
    account: {
      id: input.account.id,
      username: input.account.username,
      acct: input.account.acct,
      displayName: input.account.display_name,
      avatar: input.account.avatar,
      emojis: input.account.emojis ?? [],
    },
    reblog: input.reblog ? mapStatus(input.reblog) : null
  }
}

type MastodonStatusContext = {
  ancestors: TimelineStatus[]
  descendants: TimelineStatus[]
}

export default defineEventHandler(async (event): Promise<StatusContextResponse> => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const requestedInstance = getQuery(event).instance
  let serverOrigin: string
  let accessToken: string | null

  if (typeof requestedInstance === 'string') {
    const instance = normalizeMastodonInstance(requestedInstance)
    if (!instance || !(await isSupportedMastodonInstance(instance.hostname, configuredBase))) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported Mastodon instance.' })
    }
    serverOrigin = instance.origin
    const credentials = getOptionalRequestCredentials(event)
    accessToken = credentials?.serverOrigin === serverOrigin ? credentials.accessToken : null
  } else {
    const credentials = requireRequestCredentials(event)
    serverOrigin = credentials.serverOrigin
    accessToken = credentials.accessToken
  }
  const id = getRouterParam(event, 'id')

  if (!id || !/^[\w-]+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing status id.'
    })
  }

  const endpoint = new URL(`/api/v1/statuses/${id}/context`, serverOrigin)
  const headers: Record<string, string> = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const response = await fetch(endpoint.toString(), {
    headers,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch status context.'
    })
  }

  const payload = (await response.json()) as MastodonStatusContext

  return {
    context: {
      ancestors: payload.ancestors.map(mapStatus),
      descendants: payload.descendants.map(mapStatus)
    }
  }
})
