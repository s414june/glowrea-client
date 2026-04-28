# Feature: 登入憑證持久化

## Goal

在登入成功後，將 access token 以加密形式安全儲存於 server 端，使後續每次 API 請求都能從 credential store 取得 token，而非依賴固定環境變數。

同時為資料結構預留多帳號、多聯邦的擴充空間，但本期只實作單一帳號的完整流程。

---

## Scope

### In Scope

- 登入成功時，將 access token 以 AES-256-GCM 加密後持久化至 server 端檔案
- 每次 API 請求從 credential store 解密取得 token，不再讀取 `runtimeConfig.mastodonToken`
- Session cookie 帶有 `accountKey`（複合識別鍵），用於定位正確的 credential 記錄
- `accountKey` 格式：`${serverOrigin}::${accountId}`
- Client 端暴露 `serverOrigin`、`accountKey` 狀態，供未來多帳號 UI 使用
- `/compose` 加入受保護路由

### Out of Scope

- 多帳號切換 UI
- OAuth 2.0 完整授權流程（token 交換仍以 `runtimeConfig.mastodonToken` 為來源）
- Token 自動更新（refresh token）
- 裝置管理（多裝置登入）
- 加密金鑰輪換機制

---

## User Story

作為系統開發者，我希望 access token 不以明文儲存於記憶體或環境變數之外的地方，並且資料模型能在不破壞現有功能的情況下支援未來多帳號擴充。

---

## Data Model

### AccountKey

唯一識別一個帳號於某一聯邦實例的複合字串：

```
${serverOrigin}::${accountId}
```

範例：`https://mastodon.social::123456789`

### CredentialEntry

```ts
type CredentialEntry = {
  accountKey: string       // 複合識別鍵
  serverOrigin: string     // Mastodon 實例 origin（無尾端斜線）
  accountId: string        // 帳號在該實例的 ID
  username: string         // @前的帳號名稱
  displayName: string      // 顯示名稱
  avatar: string           // 頭像 URL
  encryptedToken: string   // 加密後的 access token（格式見下方）
  addedAt: number          // 首次新增時間（Unix ms）
  updatedAt: number        // 最後更新時間（Unix ms）
}
```

### CredentialStore

```ts
type CredentialStore = {
  version: 1
  entries: CredentialEntry[]
}
```

儲存路徑：`.data/auth/credentials.json`（server 本地，不進版本控制）

---

## Encryption Spec

### 演算法

- AES-256-GCM（提供機密性 + 完整性驗證）

### 金鑰衍生

```
key = SHA-256(secret + 'glowrea-credential-store-v1')
```

- `secret` 優先使用 `runtimeConfig.authSessionSecret`，fallback 為 `runtimeConfig.mastodonToken`

### Token 格式

加密後的 `encryptedToken` 欄位格式：

```
${ivHex}:${authTagHex}:${ciphertextHex}
```

- `iv`：12 bytes，每次加密隨機產生
- `authTag`：16 bytes，GCM 驗證標籤

---

## Session Payload 擴充

Session cookie（HMAC-SHA256 簽名）的 payload 新增欄位：

```ts
type SessionPayload = {
  accountKey: string    // 新增：用於定位 credential
  serverOrigin: string  // 新增：Mastodon 實例 origin
  accountId: string
  issuedAt: number
  nonce: string
}
```

> 既有 session cookie（缺少 `accountKey`/`serverOrigin`）在 signature 驗證通過後，因欄位驗證失敗會被拒絕，使用者需重新登入一次。這是預期行為。

---

## Server API 變更

### `POST /api/auth/login`

登入流程新增步驟：

1. 呼叫 `GET /api/v1/accounts/verify_credentials` 驗證 token 可用性（原有步驟）
2. 計算 `serverOrigin = new URL(mastodonApiBase).origin`
3. 計算 `accountKey = \`${serverOrigin}::${account.id}\``
4. 呼叫 `upsertCredential(secret, { accountKey, serverOrigin, accountId, username, displayName, avatar, accessToken })`
5. 呼叫 `setAuthSession(event, accountKey, serverOrigin, accountId)` 建立 session

回傳新增 `serverOrigin` 欄位：

```ts
{
  authenticated: true,
  account: {
    id, username, acct, displayName, avatar,
    serverOrigin  // 新增
  }
}
```

### `GET /api/auth/session`

回傳新增 `accountKey`、`serverOrigin` 欄位：

```ts
{
  authenticated: true,
  accountKey: string,   // 新增
  accountId: string,
  serverOrigin: string, // 新增
  issuedAt: number
}
```

### 受保護 API Routes（共用模式）

以下 routes 改用 `requireRequestCredentials(event)` 取代直接讀取 `runtimeConfig`：

- `GET /api/timeline/home`
- `GET /api/profile/me`
- `GET /api/profile/me/statuses`

```ts
const { accessToken, serverOrigin, accountId } = await requireRequestCredentials(event)
```

`requireRequestCredentials` 內部流程：

1. 呼叫 `requireAuthSession(event)` 取得 session（含 `accountKey`）
2. 讀取 `runtimeConfig.authSessionSecret || runtimeConfig.mastodonToken` 作為加密金鑰
3. 呼叫 `getCredential(secret, accountKey)` 解密取得 credential
4. 若找不到 credential，拋出 `401`

---

## Client 端狀態

### `useAuth` 新增欄位

```ts
const accountKey = useState<string | null>('auth:accountKey', () => null)
const serverOrigin = useState<string | null>('auth:serverOrigin', () => null)
```

- `ensureSession`：從 `GET /api/auth/session` 取得後同步 `accountKey`、`serverOrigin`
- `login`：從登入回傳的 `account.serverOrigin` 計算並同步
- `logout`：一起清除為 `null`

---

## Route Guard

`/compose` 加入受保護路由清單，未登入存取導向 `/login`。

---

## Server 工具函式

### `server/utils/credential-store.ts`

| 函式 | 說明 |
|---|---|
| `upsertCredential(secret, data)` | 加密並新增/更新一筆 credential |
| `getCredential(secret, accountKey)` | 解密並回傳指定帳號的 credential（包含明文 `accessToken`） |
| `listCredentials()` | 回傳所有 entries（不含解密 token） |
| `removeCredential(accountKey)` | 移除指定帳號的 credential |

### `server/utils/request-credentials.ts`

| 函式 | 說明 |
|---|---|
| `requireRequestCredentials(event)` | 從 session 取 accountKey，解密回傳 `{ accessToken, serverOrigin, accountId, accountKey }` |

---

## File System

```
.data/
  auth/
    credentials.json    # mode 0o600，不進版本控制
```

`.data/` 目錄應已列於 `.gitignore`。

---

## Error Handling

| 情境 | HTTP 狀態 | 說明 |
|---|---|---|
| Session 無效或已過期 | 401 | 由 `requireAuthSession` 拋出 |
| Credential store 找不到對應帳號 | 401 | 提示重新登入 |
| 加密金鑰設定缺失 | 500 | 提示環境變數未設定 |
| Credential 解密失敗（資料損毀） | 401 | 安全降級，視為未登入 |

---

## Security Notes

- access token 不以明文出現在 cookie、log 或前端狀態中
- credential 檔案設定 mode `0o600`，僅允許 server process owner 讀寫
- 加密金鑰不儲存在 credential store 本身，依賴 server 環境變數
- GCM auth tag 確保密文未被竄改（完整性驗證）
- IV 每次加密隨機產生，防止相同 token 產生相同密文
