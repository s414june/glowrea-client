export type AccountNavigationTarget = {
  acct?: string | null
  username?: string | null
}

export function useAccountNavigation() {
  const route = useRoute()
  const { hostname } = useInstanceConfig()
  const selectedInstance = useCookie<string | null>('glowrea_instance')

  const routeInstance = computed(() => {
    const value = route.params.instance
    return typeof value === 'string' ? value.toLowerCase() : null
  })

  function profilePath(account: AccountNavigationTarget, instanceOverride?: string): string {
    const instance = instanceOverride?.trim().toLowerCase()
      || routeInstance.value
      || hostname.value
      || selectedInstance.value?.trim().toLowerCase()
    const accountName = account.acct?.trim() || account.username?.trim()
    if (!instance || !accountName) return '/instances'

    const accountSegment = accountName.startsWith('@') ? accountName : `@${accountName}`
    const encodedAccount = encodeURIComponent(accountSegment).replace(/%40/gi, '@')
    return `/${encodeURIComponent(instance)}/${encodedAccount}`
  }

  return { profilePath }
}
