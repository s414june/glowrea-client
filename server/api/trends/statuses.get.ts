import type { TimelineStatus } from '#shared/types/timeline'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../utils/mastodon-instance'

export default defineEventHandler(async (event): Promise<TimelineStatus[]> => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const requestedInstance = getQuery(event).instance
  let base = configuredBase

  if (typeof requestedInstance === 'string') {
    const instance = normalizeMastodonInstance(requestedInstance)
    if (!instance || !(await isSupportedMastodonInstance(instance.hostname, configuredBase))) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported Mastodon instance.' })
    }
    base = instance.origin
  }

  if (!base) {
    throw createError({ statusCode: 500, statusMessage: 'Mastodon API base not configured.' })
  }

  const endpoint = new URL('/api/v1/trends/statuses', base)
  endpoint.searchParams.set('limit', '20')

  const response = await fetch(endpoint.toString())

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: detail || 'Failed to fetch trending statuses.',
    })
  }

  return (await response.json()) as TimelineStatus[]
})
