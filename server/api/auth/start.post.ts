import { createHash, randomBytes } from 'node:crypto'

const OAUTH_STATE_COOKIE = 'glowrea_oauth'
const OAUTH_STATE_MAX_AGE_SECONDS = 300 // 5 分鐘

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const mastodonApiBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const clientId = runtimeConfig.mastodonClientId

  if (!mastodonApiBase || !clientId) {
    throw createError({ statusCode: 500, statusMessage: 'Missing OAuth configuration.' })
  }

  const redirectUri = new URL('/api/auth/callback', getRequestURL(event).origin).toString()

  // PKCE
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  const state = randomBytes(16).toString('hex')

  // 將 state + codeVerifier + redirectUri 存入短效 httpOnly cookie，callback 時驗證
  setCookie(event, OAUTH_STATE_COOKIE, JSON.stringify({ state, codeVerifier, redirectUri }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  })

  const authUrl = new URL('/oauth/authorize', mastodonApiBase)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'read write follow')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  return { authorizationUrl: authUrl.toString() }
})
