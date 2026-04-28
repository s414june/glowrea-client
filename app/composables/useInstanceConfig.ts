/**
 * 取得目前設定的 Mastodon 實例 hostname（例如 g0v.social）。
 *
 * 使用 useState 快取，避免重複請求。首次呼叫時（SSR 或 client 初始化）
 * 從 /api/config/instance 取得並持久化至 Nuxt state。
 */
export function useInstanceConfig() {
  const hostname = useState<string | null>('instance:hostname', () => null)

  async function ensureHostname(): Promise<void> {
    if (hostname.value !== null) return

    try {
      const data = await $fetch<{ hostname: string | null }>('/api/config/instance')
      hostname.value = data.hostname
    } catch {
      hostname.value = null
    }
  }

  /** 計算本站時間軸的路徑（例如 /g0v.social/local） */
  const localPath = computed(() =>
    hostname.value ? `/${hostname.value}/local` : null,
  )

  /** 是否有設定實例（有值即為 true） */
  const hasInstance = computed(() => Boolean(hostname.value))

  return { hostname, localPath, hasInstance, ensureHostname }
}
