import type { H3Event } from 'h3'

export function getAppOrigin(event: H3Event): string {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredOrigin = runtimeConfig.appOrigin as string

  if (!configuredOrigin) {
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 500, statusMessage: 'Missing NUXT_APP_ORIGIN configuration.' })
    }

    return getRequestURL(event).origin
  }

  let parsedOrigin: URL
  try {
    parsedOrigin = new URL(configuredOrigin)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Invalid NUXT_APP_ORIGIN configuration.' })
  }

  if (
    !['http:', 'https:'].includes(parsedOrigin.protocol) ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    (process.env.NODE_ENV === 'production' && parsedOrigin.protocol !== 'https:')
  ) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid NUXT_APP_ORIGIN configuration.' })
  }

  return parsedOrigin.origin
}
