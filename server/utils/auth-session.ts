import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const AUTH_COOKIE_NAME = 'glowrea_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  accountId: string
  issuedAt: number
  nonce: string
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function getSessionSecret(event: H3Event): string {
  const runtimeConfig = useRuntimeConfig(event)
  const secret = runtimeConfig.authSessionSecret || runtimeConfig.mastodonToken

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing auth session secret configuration.'
    })
  }

  return secret
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

    if (!payload.accountId || !payload.issuedAt || !payload.nonce) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function setAuthSession(event: H3Event, accountId: string): void {
  const secret = getSessionSecret(event)
  const payload: SessionPayload = {
    accountId,
    issuedAt: Date.now(),
    nonce: randomBytes(16).toString('hex')
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
