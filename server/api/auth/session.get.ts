import { getAuthSession } from '../../utils/auth-session'

export default defineEventHandler((event) => {
  const session = getAuthSession(event)

  if (!session) {
    return {
      authenticated: false
    }
  }

  return {
    authenticated: true,
    accountId: session.accountId,
    issuedAt: session.issuedAt
  }
})
