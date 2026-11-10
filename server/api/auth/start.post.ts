import { createHash, randomBytes } from 'node:crypto'
import { getAppOrigin } from '../../utils/app-origin'
import { isSupportedMastodonInstance, normalizeMastodonInstance } from '../../utils/mastodon-instance'
import { encodeOAuthState } from '../../utils/oauth-state'

const OAUTH_STATE_COOKIE = 'glowrea_oauth'
const OAUTH_STATE_MAX_AGE_SECONDS = 300 // 5 分鐘

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const body = await readBody<{ instance?: unknown }>(event)
  let serverOrigin: string
  let clientId: string
  let clientSecret: string | undefined
  let usesConfiguredCredentials = false
  const redirectUri = new URL('/api/auth/callback', getAppOrigin(event)).toString()

  if (typeof body?.instance === 'string') {
    const instance = normalizeMastodonInstance(body.instance)
    if (!instance || !(await isSupportedMastodonInstance(instance.hostname, configuredBase))) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported Mastodon instance.' })
    }

    serverOrigin = instance.origin
    if (
      configuredBase &&
      new URL(configuredBase).origin === serverOrigin &&
      runtimeConfig.mastodonClientId &&
      runtimeConfig.mastodonClientSecret
    ) {
      clientId = runtimeConfig.mastodonClientId
      clientSecret = runtimeConfig.mastodonClientSecret
      usesConfiguredCredentials = true
    } else {
      const appResponse = await fetch(new URL('/api/v1/apps', serverOrigin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Glowrea',
          redirect_uris: redirectUri,
          scopes: 'read write follow',
          website: getAppOrigin(event),
        }),
      })
      if (!appResponse.ok) {
        throw createError({ statusCode: 502, statusMessage: '無法在這個社群建立登入授權，請改選其他社群。' })
      }

      const app = await appResponse.json() as { client_id?: string; client_secret?: string }
      clientId = app.client_id || ''
      clientSecret = app.client_secret
    }
  } else {
    if (!configuredBase) {
      throw createError({ statusCode: 400, statusMessage: '請先選擇 Mastodon 社群。' })
    }
    serverOrigin = new URL(configuredBase).origin
    clientId = runtimeConfig.mastodonClientId
    clientSecret = runtimeConfig.mastodonClientSecret
  }

  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Missing OAuth configuration.' })
  }

  // PKCE
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  const state = randomBytes(16).toString('hex')

  // 將授權資料加密後存入短效 httpOnly cookie，callback 時驗證。
  setCookie(event, OAUTH_STATE_COOKIE, encodeOAuthState(event, {
    state,
    codeVerifier,
    serverOrigin,
    clientId,
    ...(clientSecret && !usesConfiguredCredentials
      ? { clientSecret }
      : {}),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  })

  const authUrl = new URL('/oauth/authorize', serverOrigin)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'read write follow')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  return { authorizationUrl: authUrl.toString() }
})
