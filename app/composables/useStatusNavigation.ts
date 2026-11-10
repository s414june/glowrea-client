import type { TimelineStatus } from '#shared/types/timeline'

export function useStatusNavigation() {
  const router = useRouter()
  const { hostname, ensureHostname } = useInstanceConfig()

  async function openStatus(status: TimelineStatus): Promise<void> {
    await ensureHostname()
    if (!hostname.value) return

    const activeStatus = status.reblog || status
    const accountHandle = activeStatus.account.acct || activeStatus.account.username
    const accountSegment = accountHandle.startsWith('@') ? accountHandle : `@${accountHandle}`
    const encodedAccount = encodeURIComponent(accountSegment).replace(/%40/gi, '@')
    await router.push(
      `/${encodeURIComponent(hostname.value)}/${encodedAccount}/${encodeURIComponent(activeStatus.id)}`,
    )
  }

  return { openStatus }
}
