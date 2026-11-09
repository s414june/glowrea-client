import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { getSessionSecret } from './auth-session'

export type OAuthStatePayload = {
  state: string
  codeVerifier: string
}

function signature(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret)
    .update('glowrea-oauth-state-v1.')
    .update(payload)
    .digest()
}

export function encodeOAuthState(event: H3Event, value: OAuthStatePayload): string {
  const payload = Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
  const signed = signature(payload, getSessionSecret(event)).toString('base64url')
  return `${payload}.${signed}`
}

export function decodeOAuthState(event: H3Event, value: string): OAuthStatePayload | null {
  const [payload, signaturePart] = value.split('.')
  if (!payload || !signaturePart) return null

  const expected = signature(payload, getSessionSecret(event))
  const actual = Buffer.from(signaturePart, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<OAuthStatePayload>
    if (
      typeof decoded.state !== 'string' ||
      typeof decoded.codeVerifier !== 'string' ||
      !/^[a-f0-9]{32}$/.test(decoded.state) ||
      !/^[A-Za-z0-9_-]{43}$/.test(decoded.codeVerifier)
    ) {
      return null
    }

    return { state: decoded.state, codeVerifier: decoded.codeVerifier }
  } catch {
    return null
  }
}
