import { getMastodonDirectory } from '../../utils/mastodon-directory'
import { isSupportedMastodonInstance, normalizeMastodonInstance, verifyCustomMastodonInstance } from '../../utils/mastodon-instance'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ instance?: unknown }>(event)
  if (typeof body?.instance !== 'string') {
    throw createError({ statusCode: 400, statusMessage: '請輸入 Mastodon 社群網域。' })
  }

  const instance = normalizeMastodonInstance(body.instance)
  if (!instance) {
    throw createError({ statusCode: 400, statusMessage: '請輸入有效的 HTTPS 社群網域。' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  if (!await isSupportedMastodonInstance(instance.hostname, configuredBase)) {
    throw createError({ statusCode: 400, statusMessage: '找不到可用的 Mastodon 社群，請確認網域後再試。' })
  }

  const directory = await getMastodonDirectory().catch(() => [])
  const listed = directory.find((item) => item.domain === instance.hostname)
  const verified = listed ? null : await verifyCustomMastodonInstance(instance.hostname)

  return {
    domain: instance.hostname,
    title: verified?.title || listed?.domain || instance.hostname,
  }
})
