import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AccountKey, CredentialEntry, CredentialStore } from '#shared/types/auth'

// ── 檔案路徑 ──────────────────────────────────────────────────────
const STORE_PATH = join(process.cwd(), '.data', 'auth', 'credentials.json')

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

// ── 檔案讀寫 ──────────────────────────────────────────────────────

async function readStore(): Promise<CredentialStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8')
    return JSON.parse(raw) as CredentialStore
  }
  catch {
    return { version: 1, entries: [] }
  }
}

async function writeStore(store: CredentialStore): Promise<void> {
  await mkdir(join(process.cwd(), '.data', 'auth'), { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 })
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
  const store = await readStore()
  const key = deriveKey(secret)
  const encryptedToken = encryptToken(data.accessToken, key)
  const now = Date.now()
  const existingIdx = store.entries.findIndex(e => e.accountKey === data.accountKey)

  const entry: CredentialEntry = {
    accountKey: data.accountKey,
    serverOrigin: data.serverOrigin,
    accountId: data.accountId,
    username: data.username,
    displayName: data.displayName,
    avatar: data.avatar,
    encryptedToken,
    addedAt: existingIdx === -1 ? now : store.entries[existingIdx]!.addedAt,
    updatedAt: now,
  }

  if (existingIdx === -1) {
    store.entries.push(entry)
  }
  else {
    store.entries[existingIdx] = entry
  }

  await writeStore(store)
}

/**
 * 取得指定帳號的解密後 access token 與 serverOrigin。
 * 若找不到或解密失敗，回傳 null。
 */
export async function getCredential(
  secret: string,
  accountKey: AccountKey,
): Promise<{ accessToken: string, serverOrigin: string, accountId: string } | null> {
  const store = await readStore()
  const entry = store.entries.find(e => e.accountKey === accountKey)
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
  const store = await readStore()
  return store.entries.map(({ encryptedToken: _enc, ...rest }) => rest)
}

/** 移除特定帳號的 credential（永久解除連結）。 */
export async function removeCredential(accountKey: AccountKey): Promise<void> {
  const store = await readStore()
  store.entries = store.entries.filter(e => e.accountKey !== accountKey)
  await writeStore(store)
}
