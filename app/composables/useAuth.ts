type LoginAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
}

type LoginResponse = {
  authenticated: boolean
  account: LoginAccount
}

type SessionResponse = {
  authenticated: boolean
  accountId?: string
}

export function useAuth() {
  const isAuthenticated = useState<boolean>('auth:isAuthenticated', () => false)
  const isLoading = useState<boolean>('auth:isLoading', () => false)
  const errorMessage = useState<string | null>('auth:errorMessage', () => null)
  const accountId = useState<string | null>('auth:accountId', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)

  async function ensureSession(force = false): Promise<boolean> {
    if (initialized.value && !force) {
      return isAuthenticated.value
    }

    try {
      const session = await $fetch<SessionResponse>('/api/auth/session')
      isAuthenticated.value = session.authenticated
      accountId.value = session.authenticated ? session.accountId || null : null
    } catch {
      isAuthenticated.value = false
      accountId.value = null
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
        method: 'POST'
      })

      isAuthenticated.value = Boolean(response.authenticated)
      accountId.value = response.account.id
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
        method: 'POST'
      })
      isAuthenticated.value = false
      accountId.value = null
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
    initialized,
    ensureSession,
    login,
    logout,
    clearError
  }
}
