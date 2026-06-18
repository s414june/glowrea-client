import { setAuthSession } from '../../utils/auth-session'

const OAUTH_STATE_COOKIE = 'glowrea_oauth'

type OAuthStateCookie = {
  state: string
  codeVerifier: string
  redirectUri: string
}

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

  let stored: OAuthStateCookie
  try {
    stored = JSON.parse(stateCookieRaw) as OAuthStateCookie
  } catch {
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

  if (!mastodonApiBase || !clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Missing OAuth configuration.' })
  }

  // 使用與 start 時完全相同的 redirectUri（從 cookie 讀回），避免字串不符
  const redirectUri = stored.redirectUri

  // 以 code + code_verifier 交換 access token
  const tokenRes = await fetch(new URL('/oauth/token', mastodonApiBase).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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
  const credRes = await fetch(new URL('/api/v1/accounts/verify_credentials', mastodonApiBase).toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!credRes.ok) {
    throw createError({ statusCode: 401, statusMessage: 'Failed to verify credentials.' })
  }

  const account = await credRes.json() as VerifyCredentialsResponse
  const serverOrigin = new URL(mastodonApiBase).origin
  const accountKey = `${serverOrigin}::${account.id}`

  // 將加密後的 token 封入 session cookie，導向主頁
  setAuthSession(event, accountKey, serverOrigin, String(account.id), accessToken)

  return sendRedirect(event, '/timelines')
})
