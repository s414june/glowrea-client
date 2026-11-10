/**
 * 取得目前設定的 Mastodon 實例 hostname（例如 g0v.social）。
 *
 * 使用 useState 快取，並用一般 cookie 記住使用者上次選擇的實例。
 * 沒有已選實例時，首次呼叫會從 /api/config/instance 讀取部署預設值。
 */
export function useInstanceConfig() {
  const hostname = useState<string | null>('instance:hostname', () => null)
  const selectedInstance = useCookie<string | null>('glowrea_instance', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })

  function isValidHostname(value: string): boolean {
    return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)
  }

  function setHostname(value: string | null): void {
    const normalized = value?.trim().toLowerCase() || null
    if (normalized && !isValidHostname(normalized)) return
    hostname.value = normalized
    selectedInstance.value = normalized
  }

  async function ensureHostname(): Promise<void> {
    if (hostname.value !== null) return

    const selected = selectedInstance.value?.trim().toLowerCase()
    if (selected && isValidHostname(selected)) {
      hostname.value = selected
      return
    }

    try {
      const data = await $fetch<{ hostname: string | null }>('/api/config/instance')
      hostname.value = data.hostname
      if (data.hostname && isValidHostname(data.hostname)) {
        selectedInstance.value = data.hostname
      }
    } catch {
      hostname.value = null
    }
  }

  /** 計算本站時間軸的路徑（例如 /timelines/g0v.social/local） */
  const localPath = computed(() =>
    hostname.value ? `/timelines/${hostname.value}/local` : null,
  )

  /** 登入路徑沿用目前實例；沒有實例時才進入實例清單。 */
  const loginPath = computed(() =>
    hostname.value ? `/login/${encodeURIComponent(hostname.value)}` : '/login',
  )

  /** 聯邦時間軸路徑（固定為 /timelines/federated，不帶 instance） */
  const federatedPath = '/timelines/federated'

  /** 是否有設定實例（有值即為 true） */
  const hasInstance = computed(() => Boolean(hostname.value))

  return { hostname, localPath, loginPath, federatedPath, hasInstance, ensureHostname, setHostname }
}
