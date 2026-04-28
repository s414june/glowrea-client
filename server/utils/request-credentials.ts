import type { H3Event } from 'h3'
import { getCredential } from './credential-store'
import { requireAuthSession } from './auth-session'

export type RequestCredentials = {
  accessToken: string
  serverOrigin: string
  accountId: string
  accountKey: string
}

/**
 * 從 session cookie 取出 accountKey，再從 credential store 解密 access token。
 * 若 session 無效或找不到 credential 則拋出對應 HTTP 錯誤。
 *
 * 所有需要 Mastodon API 的 server route 應使用此函式取代直接讀取 runtimeConfig.mastodonToken。
 */
export async function requireRequestCredentials(event: H3Event): Promise<RequestCredentials> {
  const session = requireAuthSession(event)

  const runtimeConfig = useRuntimeConfig(event)
  const secret = (runtimeConfig.authSessionSecret || runtimeConfig.mastodonToken) as string

  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Missing auth session secret configuration.' })
  }

  const creds = await getCredential(secret, session.accountKey)

  if (!creds) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session credentials not found or expired. Please log in again.',
    })
  }

  return {
    accessToken: creds.accessToken,
    serverOrigin: creds.serverOrigin,
    accountId: creds.accountId,
    accountKey: session.accountKey,
  }
}
