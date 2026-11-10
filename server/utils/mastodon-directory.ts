export type MastodonDirectoryInstance = {
  domain: string
  description: string
  total_users?: number
  last_week_users?: number
  approval_required?: boolean
  categories?: string[]
  languages?: string[]
}

const DIRECTORY_URL = 'https://api.joinmastodon.org/servers?language=&category=&region=&ownership=&registrations='
const DIRECTORY_TTL_MS = 30 * 60 * 1000
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

let cachedInstances: MastodonDirectoryInstance[] | null = null
let cachedUntil = 0
let pendingRequest: Promise<MastodonDirectoryInstance[]> | null = null

export async function getMastodonDirectory(): Promise<MastodonDirectoryInstance[]> {
  if (cachedInstances && Date.now() < cachedUntil) return cachedInstances
  if (pendingRequest) return pendingRequest

  const request = (async () => {
    const response = await fetch(DIRECTORY_URL, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) {
      throw createError({ statusCode: 502, statusMessage: '無法載入 Mastodon 社群清單。' })
    }

    const payload = await response.json() as unknown
    const entries = Array.isArray(payload)
      ? payload
      : typeof payload === 'object' && payload && 'servers' in payload && Array.isArray(payload.servers)
        ? payload.servers
        : null

    if (!entries) {
      throw createError({ statusCode: 502, statusMessage: 'Mastodon 社群清單格式無效。' })
    }

    const instances = entries.flatMap((entry): MastodonDirectoryInstance[] => {
      if (typeof entry !== 'object' || !entry || !('domain' in entry) || typeof entry.domain !== 'string') {
        return []
      }

      const domain = entry.domain.toLowerCase()
      if (!DOMAIN_PATTERN.test(domain)) return []

      return [{
        domain,
        description: 'description' in entry && typeof entry.description === 'string' ? entry.description.trim() : '',
        ...( 'total_users' in entry && typeof entry.total_users === 'number' ? { total_users: entry.total_users } : {}),
        ...( 'last_week_users' in entry && typeof entry.last_week_users === 'number' ? { last_week_users: entry.last_week_users } : {}),
        ...( 'approval_required' in entry && typeof entry.approval_required === 'boolean' ? { approval_required: entry.approval_required } : {}),
        ...( 'categories' in entry && Array.isArray(entry.categories) ? { categories: entry.categories.filter((item): item is string => typeof item === 'string') } : {}),
        ...( 'languages' in entry && Array.isArray(entry.languages) ? { languages: entry.languages.filter((item): item is string => typeof item === 'string') } : {}),
      }]
    })

    const uniqueInstances = [...new Map(instances.map((instance) => [instance.domain, instance])).values()]
      .sort((a, b) => a.domain.localeCompare(b.domain, 'en', { sensitivity: 'base' }))

    cachedInstances = uniqueInstances
    cachedUntil = Date.now() + DIRECTORY_TTL_MS
    return uniqueInstances
  })()
  pendingRequest = request

  try {
    return await request
  } finally {
    pendingRequest = null
  }
}
