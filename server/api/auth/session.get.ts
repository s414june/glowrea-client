import { getAuthSession } from '../../utils/auth-session'

export default defineEventHandler((event) => {
  const session = getAuthSession(event)

  if (!session) {
    return { authenticated: false }
  }

  return {
    authenticated: true,
    accountKey: session.accountKey,
    accountId: session.accountId,
    serverOrigin: session.serverOrigin,
    issuedAt: session.issuedAt,
  }
})
