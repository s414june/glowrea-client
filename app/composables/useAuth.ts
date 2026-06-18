type SessionResponse = {
  authenticated: boolean
  accountId?: string
  accountKey?: string
  serverOrigin?: string
}

export function useAuth() {
  const isAuthenticated = useState<boolean>('auth:isAuthenticated', () => false)
  const isLoading = useState<boolean>('auth:isLoading', () => false)
  const errorMessage = useState<string | null>('auth:errorMessage', () => null)
  const accountId = useState<string | null>('auth:accountId', () => null)
  const accountKey = useState<string | null>('auth:accountKey', () => null)
  const serverOrigin = useState<string | null>('auth:serverOrigin', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)

  async function ensureSession(force = false): Promise<boolean> {
    if (initialized.value && !force) {
      return isAuthenticated.value
    }

    // 在 SSR 階段，$fetch 不會自動帶入瀏覽器 cookie，需手動轉送
    const headers = useRequestHeaders(['cookie'])

    try {
      const session = await $fetch<SessionResponse>('/api/auth/session', { headers })
      isAuthenticated.value = session.authenticated
      accountId.value = session.authenticated ? session.accountId || null : null
      accountKey.value = session.authenticated ? session.accountKey || null : null
      serverOrigin.value = session.authenticated ? session.serverOrigin || null : null
    } catch {
      isAuthenticated.value = false
      accountId.value = null
      accountKey.value = null
      serverOrigin.value = null
    } finally {
      initialized.value = true
    }

    return isAuthenticated.value
  }

  async function login(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const { authorizationUrl } = await $fetch<{ authorizationUrl: string }>('/api/auth/start', {
        method: 'POST',
      })
      // 導向 Mastodon 授權頁，頁面會離開，不再回來此函式
      await navigateTo(authorizationUrl, { external: true })
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error && 'statusMessage' in error
          ? String((error as { statusMessage?: string }).statusMessage || 'Login failed.')
          : 'Login failed.'
      errorMessage.value = message
      isLoading.value = false
    }
    // 導向期間 isLoading 保持 true，頁面跳轉後自然消失
  }

  async function logout(): Promise<void> {
    if (isLoading.value) {
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })
      isAuthenticated.value = false
      accountId.value = null
      accountKey.value = null
      serverOrigin.value = null
      initialized.value = true
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error && 'statusMessage' in error
          ? String((error as { statusMessage?: string }).statusMessage || 'Logout failed.')
          : 'Logout failed.'

      errorMessage.value = message
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function clearError(): void {
    errorMessage.value = null
  }

  return {
    isAuthenticated,
    isLoading,
    errorMessage,
    accountId,
    accountKey,
    serverOrigin,
    initialized,
    ensureSession,
    login,
    logout,
    clearError,
  }
}

