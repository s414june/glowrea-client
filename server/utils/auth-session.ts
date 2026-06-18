import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const AUTH_COOKIE_NAME = 'glowrea_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type SessionPayload = {
  /** 複合鍵，格式：`${serverOrigin}::${accountId}` */
  accountKey: string
  /** Mastodon 實例 origin，例如 https://mastodon.social */
  serverOrigin: string
  /** 帳號在該實例的 ID */
  accountId: string
  /** session 建立時間（Unix ms） */
  issuedAt: number
  /** 防重放 nonce */
  nonce: string
  /** AES-256-GCM 加密後的 Mastodon access token，格式：`ivHex:tagHex:ctHex` */
  encryptedToken: string
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function getSessionSecret(event: H3Event): string {
  const runtimeConfig = useRuntimeConfig(event)
  const secret = runtimeConfig.authSessionSecret as string

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NUXT_AUTH_SESSION_SECRET configuration.'
    })
  }

  return secret
}

// ── Token 加密 (專用於 session cookie 內的 access token) ────────────────

function deriveTokenKey(secret: string): Buffer {
  return createHash('sha256')
    .update(secret)
    .update('glowrea-session-token-v1')
    .digest()
}

export function encryptToken(token: string, secret: string): string {
  const key = deriveTokenKey(secret)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`
}

export function decryptToken(encrypted: string, secret: string): string {
  const parts = encrypted.split(':')
  if (parts.length !== 3) throw new Error('Invalid token format.')
  const [ivHex, tagHex, ctHex] = parts as [string, string, string]
  const key = deriveTokenKey(secret)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf8')
}

function signPayload(payloadPart: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadPart).digest('base64url')
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return timingSafeEqual(aBuffer, bBuffer)
}

function encodeSessionToken(payload: SessionPayload, secret: string): string {
  const payloadPart = toBase64Url(JSON.stringify(payload))
  const signaturePart = signPayload(payloadPart, secret)
  return `${payloadPart}.${signaturePart}`
}

function decodeSessionToken(token: string, secret: string): SessionPayload | null {
  const [payloadPart, signaturePart] = token.split('.')

  if (!payloadPart || !signaturePart) {
    return null
  }

  const expectedSignature = signPayload(payloadPart, secret)

  if (!constantTimeEqual(signaturePart, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload

    if (!payload.accountKey || !payload.serverOrigin || !payload.accountId || !payload.issuedAt || !payload.nonce || !payload.encryptedToken) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function setAuthSession(
  event: H3Event,
  accountKey: string,
  serverOrigin: string,
  accountId: string,
  accessToken: string,
): void {
  const secret = getSessionSecret(event)
  const payload: SessionPayload = {
    accountKey,
    serverOrigin,
    accountId,
    issuedAt: Date.now(),
    nonce: randomBytes(16).toString('hex'),
    encryptedToken: encryptToken(accessToken, secret),
  }

  const token = encodeSessionToken(payload, secret)

  setCookie(event, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
}

export function clearAuthSession(event: H3Event): void {
  deleteCookie(event, AUTH_COOKIE_NAME, {
    path: '/'
  })
}

export function getAuthSession(event: H3Event): SessionPayload | null {
  const token = getCookie(event, AUTH_COOKIE_NAME)

  if (!token) {
    return null
  }

  const secret = getSessionSecret(event)
  return decodeSessionToken(token, secret)
}

export function requireAuthSession(event: H3Event): SessionPayload {
  const session = getAuthSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized.'
    })
  }

  return session
}
