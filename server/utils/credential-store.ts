import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { Redis } from '@upstash/redis'
import type { AccountKey, CredentialEntry } from '#shared/types/auth'

// ── Redis 實例 ────────────────────────────────────────────────────
// 需設定環境變數：KV_REST_API_URL、KV_REST_API_TOKEN（Vercel KV/Upstash 整合自動注入）
function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

const KV_PREFIX = 'glowrea:cred:'

// ── 加密工具 ──────────────────────────────────────────────────────

/**
 * 從 auth session secret 衍生 AES-256 金鑰。
 * 使用 SHA-256(secret + domain) 確保 credential store
 * 與 session token 的簽名金鑰相互獨立。
 */
function deriveKey(secret: string): Buffer {
  return createHash('sha256')
    .update(secret)
    .update('glowrea-credential-store-v1')
    .digest()
}

/**
 * 以 AES-256-GCM 加密 access token。
 * 每次加密使用隨機 12-byte IV，回傳格式：`${ivHex}:${authTagHex}:${ciphertextHex}`
 */
function encryptToken(token: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`
}

/** 解密 `encryptToken` 產生的加密字串。若驗證失敗會拋錯。 */
function decryptToken(encrypted: string, key: Buffer): string {
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format.')
  }

  const [ivHex, tagHex, ctHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const ct = Buffer.from(ctHex, 'hex')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

// ── 公開 API ──────────────────────────────────────────────────────

/** 新增或更新一個帳號的 access token（登入時呼叫）。 */
export async function upsertCredential(
  secret: string,
  data: {
    accountKey: AccountKey
    serverOrigin: string
    accountId: string
    username: string
    displayName: string
    avatar: string
    accessToken: string
  },
): Promise<void> {
  const redis = getRedis()
  const key = deriveKey(secret)
  const encryptedToken = encryptToken(data.accessToken, key)
  const now = Date.now()

  const existing = await redis.get<CredentialEntry>(`${KV_PREFIX}${data.accountKey}`)

  const entry: CredentialEntry = {
    accountKey: data.accountKey,
    serverOrigin: data.serverOrigin,
    accountId: data.accountId,
    username: data.username,
    displayName: data.displayName,
    avatar: data.avatar,
    encryptedToken,
    addedAt: existing ? existing.addedAt : now,
    updatedAt: now,
  }

  await redis.set(`${KV_PREFIX}${data.accountKey}`, entry)
}

/**
 * 取得指定帳號的解密後 access token 與 serverOrigin。
 * 若找不到或解密失敗，回傳 null。
 */
export async function getCredential(
  secret: string,
  accountKey: AccountKey,
): Promise<{ accessToken: string, serverOrigin: string, accountId: string } | null> {
  const redis = getRedis()
  const entry = await redis.get<CredentialEntry>(`${KV_PREFIX}${accountKey}`)
  if (!entry) return null

  try {
    const key = deriveKey(secret)
    const accessToken = decryptToken(entry.encryptedToken, key)
    return { accessToken, serverOrigin: entry.serverOrigin, accountId: entry.accountId }
  }
  catch {
    return null
  }
}

/** 列出所有已儲存帳號的基本資料（不含 token）。用於未來多帳號 UI。 */
export async function listCredentials(): Promise<Omit<CredentialEntry, 'encryptedToken'>[]> {
  const redis = getRedis()
  const keys = await redis.keys(`${KV_PREFIX}*`)
  if (keys.length === 0) return []

  const entries = await redis.mget<CredentialEntry[]>(...keys)
  return entries
    .filter((e): e is CredentialEntry => e !== null)
    .map(({ encryptedToken: _enc, ...rest }) => rest)
}

/** 移除特定帳號的 credential（永久解除連結）。 */
export async function removeCredential(accountKey: AccountKey): Promise<void> {
  const redis = getRedis()
  await redis.del(`${KV_PREFIX}${accountKey}`)
}
