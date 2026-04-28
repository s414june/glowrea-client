type LoginAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
  serverOrigin: string
}

type LoginResponse = {
  authenticated: boolean
  account: LoginAccount
}

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

  async function login(): Promise<boolean> {
    if (isLoading.value) {
      return false
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const response = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
      })

      isAuthenticated.value = Boolean(response.authenticated)
      accountId.value = response.account.id
      accountKey.value = `${response.account.serverOrigin}::${response.account.id}`
      serverOrigin.value = response.account.serverOrigin
      initialized.value = true
      return isAuthenticated.value
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error && 'statusMessage' in error
          ? String((error as { statusMessage?: string }).statusMessage || 'Login failed.')
          : 'Login failed.'

      errorMessage.value = message
      isAuthenticated.value = false
      accountId.value = null
      accountKey.value = null
      serverOrigin.value = null
      initialized.value = true
      return false
    } finally {
      isLoading.value = false
    }
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

