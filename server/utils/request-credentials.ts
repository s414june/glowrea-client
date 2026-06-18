import type { H3Event } from 'h3'
import { decryptToken, requireAuthSession } from './auth-session'

export type RequestCredentials = {
  accessToken: string
  serverOrigin: string
  accountId: string
  accountKey: string
}

/**
 * 從 session cookie 取出帳號資訊並解密 access token。
 * token 以 AES-256-GCM 加密存放於 session payload，不依賴外部 KV。
 */
export function requireRequestCredentials(event: H3Event): RequestCredentials {
  const session = requireAuthSession(event)

  const runtimeConfig = useRuntimeConfig(event)
  const secret = runtimeConfig.authSessionSecret as string

  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Missing NUXT_AUTH_SESSION_SECRET configuration.' })
  }

  let accessToken: string
  try {
    accessToken = decryptToken(session.encryptedToken, secret)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Session token invalid. Please log in again.' })
  }

  return {
    accessToken,
    serverOrigin: session.serverOrigin,
    accountId: session.accountId,
    accountKey: session.accountKey,
  }
}
