import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { getSessionSecret } from './auth-session'

export type OAuthStatePayload = {
  state: string
  codeVerifier: string
  serverOrigin: string
  clientId: string
  clientSecret?: string
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256')
    .update(secret)
    .update('glowrea-oauth-state-v2')
    .digest()
}

export function encodeOAuthState(event: H3Event, value: OAuthStatePayload): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(getSessionSecret(event)), iv)
  cipher.setAAD(Buffer.from('glowrea-oauth-state-v2'))
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ])
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString('base64url'))
    .join('.')
}

export function decodeOAuthState(event: H3Event, value: string): OAuthStatePayload | null {
  const [ivPart, tagPart, encryptedPart] = value.split('.')
  if (!ivPart || !tagPart || !encryptedPart) return null

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      deriveKey(getSessionSecret(event)),
      Buffer.from(ivPart, 'base64url'),
    )
    decipher.setAAD(Buffer.from('glowrea-oauth-state-v2'))
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
    const decoded = JSON.parse(plaintext) as Partial<OAuthStatePayload>
    if (
      typeof decoded.state !== 'string' ||
      typeof decoded.codeVerifier !== 'string' ||
      typeof decoded.serverOrigin !== 'string' ||
      typeof decoded.clientId !== 'string' ||
      (decoded.clientSecret !== undefined && typeof decoded.clientSecret !== 'string') ||
      !/^[a-f0-9]{32}$/.test(decoded.state) ||
      !/^[A-Za-z0-9_-]{43}$/.test(decoded.codeVerifier)
    ) {
      return null
    }

    return {
      state: decoded.state,
      codeVerifier: decoded.codeVerifier,
      serverOrigin: decoded.serverOrigin,
      clientId: decoded.clientId,
      ...(decoded.clientSecret ? { clientSecret: decoded.clientSecret } : {}),
    }
  } catch {
    return null
  }
}
