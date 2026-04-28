import { upsertCredential } from '../../utils/credential-store'
import { setAuthSession } from '../../utils/auth-session'

type VerifyCredentialsResponse = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const mastodonApiBase = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase
  const mastodonToken = runtimeConfig.mastodonToken

  if (!mastodonApiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing MASTODON_API_BASE configuration.',
    })
  }

  if (!mastodonToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing MASTODON_TOKEN configuration.',
    })
  }

  const endpoint = new URL('/api/v1/accounts/verify_credentials', mastodonApiBase)
  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${mastodonToken}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw createError({
      statusCode: response.status === 401 ? 401 : 500,
      statusMessage: detail || 'Failed to verify Mastodon credentials.',
    })
  }

  const account = (await response.json()) as VerifyCredentialsResponse
  const serverOrigin = new URL(mastodonApiBase).origin
  const accountKey = `${serverOrigin}::${account.id}`

  // 將 access token 加密後儲存至 credential store
  const secret = (runtimeConfig.authSessionSecret || mastodonToken) as string
  await upsertCredential(secret, {
    accountKey,
    serverOrigin,
    accountId: String(account.id),
    username: account.username,
    displayName: account.display_name,
    avatar: account.avatar,
    accessToken: mastodonToken as string,
  })

  setAuthSession(event, accountKey, serverOrigin, String(account.id))

  return {
    authenticated: true,
    account: {
      id: String(account.id),
      username: account.username,
      acct: account.acct,
      displayName: account.display_name,
      avatar: account.avatar,
      serverOrigin,
    },
  }
})
