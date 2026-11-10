import { setAuthSession } from '../../utils/auth-session'
import { getAppOrigin } from '../../utils/app-origin'
import { decodeOAuthState, type OAuthStatePayload } from '../../utils/oauth-state'

const OAUTH_STATE_COOKIE = 'glowrea_oauth'

type TokenResponse = {
  access_token: string
}

type VerifyCredentialsResponse = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
}

export default defineEventHandler(async (event) => {
  const { code, state: stateParam } = getQuery(event) as { code?: string; state?: string }

  if (!code || !stateParam) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code or state parameter.' })
  }

  // 讀取並驗證 state cookie
  const stateCookieRaw = getCookie(event, OAUTH_STATE_COOKIE)
  if (!stateCookieRaw) {
    throw createError({ statusCode: 400, statusMessage: 'OAuth state expired or missing. Please try again.' })
  }

  const stored: OAuthStatePayload | null = decodeOAuthState(event, stateCookieRaw)
  if (!stored) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state cookie.' })
  }

  if (stored.state !== stateParam) {
    throw createError({ statusCode: 400, statusMessage: 'OAuth state mismatch.' })
  }

  // 立即清除 state cookie（防止重放）
  deleteCookie(event, OAUTH_STATE_COOKIE, { path: '/' })

  const runtimeConfig = useRuntimeConfig(event)
  const mastodonApiBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const clientId = runtimeConfig.mastodonClientId
  const clientSecret = runtimeConfig.mastodonClientSecret

  const serverOrigin = stored.serverOrigin || (mastodonApiBase ? new URL(mastodonApiBase).origin : '')
  const oauthClientId = stored.clientId || clientId
  const oauthClientSecret = stored.clientSecret || clientSecret
  if (!serverOrigin || !oauthClientId || !oauthClientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Missing OAuth configuration.' })
  }

  // 固定使用部署設定的 app origin，避免信任 callback request 的 Host header。
  const redirectUri = new URL('/api/auth/callback', getAppOrigin(event)).toString()

  // 以 code + code_verifier 交換 access token
  const tokenRes = await fetch(new URL('/oauth/token', serverOrigin).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauthClientId,
      client_secret: oauthClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
      code_verifier: stored.codeVerifier,
    }).toString(),
  })

  if (!tokenRes.ok) {
    const detail = await tokenRes.text()
    throw createError({ statusCode: 401, statusMessage: detail || 'Failed to exchange OAuth code.' })
  }

  const { access_token: accessToken } = await tokenRes.json() as TokenResponse

  // 驗證 token 並取得帳號資訊
  const credRes = await fetch(new URL('/api/v1/accounts/verify_credentials', serverOrigin).toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!credRes.ok) {
    throw createError({ statusCode: 401, statusMessage: 'Failed to verify credentials.' })
  }

  const account = await credRes.json() as VerifyCredentialsResponse
  const accountKey = `${serverOrigin}::${account.id}`

  // 將加密後的 token 封入 session cookie，導向主頁
  setAuthSession(event, accountKey, serverOrigin, String(account.id), accessToken)

  const instanceHost = new URL(serverOrigin).hostname.toLowerCase()
  const previousLogins = getCookie(event, 'glowrea_login_instances')
  let loginInstances: string[] = []
  try {
    const parsed = previousLogins ? JSON.parse(previousLogins) as unknown : []
    if (Array.isArray(parsed)) {
      loginInstances = parsed.filter((item): item is string => typeof item === 'string')
    }
  } catch {
    loginInstances = []
  }
  const validPreviousLogins = [...new Set(loginInstances
    .map((host) => host.toLowerCase())
    .filter((host) => /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(host)))]
    .filter((host) => host !== instanceHost)
    .slice(0, 19)
  setCookie(event, 'glowrea_login_instances', JSON.stringify([
    instanceHost,
    ...validPreviousLogins,
  ]), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  return sendRedirect(event, '/timelines')
})
