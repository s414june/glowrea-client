import { getMastodonDirectory } from './mastodon-directory'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const SUPPORTED_INSTANCE_HOSTS = new Set(['g0v.social', 'mastodon.social'])
const verifiedInstances = new Map<string, { instance: VerifiedMastodonInstance | null; expiresAt: number }>()
const pendingVerifications = new Map<string, Promise<VerifiedMastodonInstance | null>>()

export type VerifiedMastodonInstance = {
  domain: string
  title: string
  description: string
}

export function normalizeMastodonInstance(input: string): URL | null {
  const value = input.trim()
  if (!value || value.length > 253) return null

  let url: URL
  try {
    url = new URL(value.includes('://') ? value : `https://${value}`)
  } catch {
    return null
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !url.hostname.includes('.') ||
    isIP(url.hostname) !== 0 ||
    url.hostname === 'localhost' ||
    ['.local', '.localhost', '.internal', '.test', '.invalid', '.example'].some((suffix) => url.hostname.endsWith(suffix))
  ) {
    return null
  }

  return url
}

export async function isSupportedMastodonInstance(hostname: string, configuredBase?: string): Promise<boolean> {
  const normalizedHost = hostname.toLowerCase()
  if (SUPPORTED_INSTANCE_HOSTS.has(normalizedHost)) return true

  if (configuredBase) {
    try {
      if (new URL(configuredBase).hostname.toLowerCase() === normalizedHost) return true
    } catch {
      // Ignore malformed deployment configuration here; request validation handles it separately.
    }
  }

  if (await verifyCustomMastodonInstance(normalizedHost)) return true

  try {
    const instances = await getMastodonDirectory()
    return instances.some((instance) => instance.domain === normalizedHost)
  } catch {
    // A directory outage should not prevent a valid custom Mastodon instance from being checked.
    return false
  }
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) {
    const octets = address.split('.').map(Number)
    const [a = 0, b = 0, c = 0] = octets
    return !(
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    )
  }

  if (family !== 6) return false
  const normalized = address.toLowerCase()
  return !(
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('::ffff:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:') ||
    !/^2[0-9a-f]{3}:/i.test(normalized)
  )
}

async function hasPublicDns(hostname: string): Promise<boolean> {
  const addresses = await lookup(hostname, { all: true, verbatim: true })
  return addresses.length > 0 && addresses.every(({ address }) => isPublicAddress(address))
}

export async function verifyCustomMastodonInstance(hostname: string): Promise<VerifiedMastodonInstance | null> {
  const normalizedHost = hostname.toLowerCase()
  const cached = verifiedInstances.get(normalizedHost)
  if (cached && cached.expiresAt > Date.now()) return cached.instance
  const pending = pendingVerifications.get(normalizedHost)
  if (pending) return pending

  const verification = (async (): Promise<VerifiedMastodonInstance | null> => {
    try {
      if (!await hasPublicDns(normalizedHost)) return null

      for (const path of ['/api/v2/instance', '/api/v1/instance']) {
        const response = await fetch(new URL(path, `https://${normalizedHost}`).toString(), {
          redirect: 'manual',
          signal: AbortSignal.timeout(8_000),
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) continue

        const payload = await response.json() as Record<string, unknown>
        const domain = typeof payload.domain === 'string'
          ? payload.domain.toLowerCase()
          : typeof payload.uri === 'string'
            ? payload.uri.toLowerCase()
            : ''
        if (domain !== normalizedHost) continue

        const instance = {
          domain: normalizedHost,
          title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : normalizedHost,
          description: typeof payload.description === 'string'
            ? payload.description.trim()
            : typeof payload.short_description === 'string'
              ? payload.short_description.trim()
              : '',
        }
        verifiedInstances.set(normalizedHost, { instance, expiresAt: Date.now() + 6 * 60 * 60 * 1000 })
        return instance
      }
    } catch {
      // Treat DNS, TLS, timeout, and API failures as an unavailable custom instance.
    }

    verifiedInstances.set(normalizedHost, { instance: null, expiresAt: Date.now() + 2 * 60 * 1000 })
    return null
  })()

  pendingVerifications.set(normalizedHost, verification)
  try {
    return await verification
  } finally {
    pendingVerifications.delete(normalizedHost)
  }
}
