# Feature: Login / Logout（單一帳號）

## Goal

提供最小可用的登入與登出流程，讓使用者可以進入受保護頁面（`/timelines`）並在需要時安全登出。

此階段只支援「單一帳號」，優先驗證：

- 登入狀態切換是否正確
- route guard 與頁面導向是否清楚
- token 使用與清除是否一致
- 錯誤狀態是否可被使用者理解與恢復

---

## Scope

### In Scope

- 單一帳號登入（不支援帳號切換）
- 登入成功後可進入 `/timelines`
- 未登入使用者不可進入 `/timelines`
- 使用者可從已登入狀態登出
- 登出後返回未登入入口（`/login`）
- 基本 loading / error UI
- 基本 session 狀態管理（client side）

### Out of Scope

- 多帳號管理與快速切換
- OAuth 授權頁完整互動細節（此階段可先以既有 token 機制接軌）
- 記住我、裝置管理、2FA
- 密碼重設、註冊流程
- SSO / 第三方登入
- 權限分級（admin/moderator 等）

---

## User Story

作為使用者，我希望能登入後使用首頁時間軸，並在離開裝置或切換使用情境時能安全登出，避免他人繼續使用我的登入狀態。

---

## User Flow

1. 使用者進入 `/login`
2. 點擊登入按鈕並開始登入流程
3. 登入中顯示 loading，避免重複提交
4. 登入成功後寫入 session 狀態並導向 `/timelines`
5. 若登入失敗，顯示可理解的錯誤訊息與重試入口
6. 已登入使用者在 `/timelines` 可觸發登出
7. 系統清除 session 狀態後導向 `/login`
8. 登出後若再訪問 `/timelines`，應被導向 `/login`

---

## Route

### Paths

- `/login`：登入入口頁
- `/timelines`：登入後主頁（受保護）

### Route Responsibility

- `login route`
  - 提供登入入口與狀態呈現（idle/loading/error）
  - 不處理 timeline 資料
- `home route`
  - 僅在登入狀態下可進入
  - 不負責登入憑證交換

### Route Guard Rules

- 未登入存取 `/timelines`（或任何受保護路由）→ 導向 `/login`
- 已登入存取 `/login` → 導向 `/timelines`
- 登出完成後，任何受保護路由都應視為未登入
- 根路由 `/` → 依登入狀態重導向（已登入 `/timelines`、未登入 `/login`），以 `replace: true` 取代歷史記錄
- 不存在的路由 → 由 Nuxt error page（`app/error.vue`）顯示 404，**不導向 `/login`**
  - 403（未授權）與 404（不存在）行為完全分開，避免混淆

---

## UI Requirements

### Login Page

- 明確頁面標題（例如：登入 Glowrea）
- 主要登入操作按鈕
- 登入中狀態（disable 按鈕 + loading 文案）
- 錯誤訊息區塊（可重試）

### Logout Entry

- 在登入後可見位置提供登出入口（例如 header/menu）
- 登出中應暫時 disable 重複操作

### Feedback States

- Login loading: 顯示「登入中...」或等效狀態
- Login error: 顯示可理解訊息（例如：授權失敗、網路異常）
- Logout success: 導向 `/login` 視為成功回饋

---

## State Model

### AuthState

```ts
type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  errorMessage: string | null
  accountId: string
}
```

### Notes

- `accountId` 在單一帳號階段可為固定值（例如 `default`），僅用於保留未來擴充欄位。
- 不維護 account list。

---

## Data & Session Strategy

- 先沿用目前專案既有 token 供應方式（server runtime config）。
- client 端只管理「是否已登入」與 UI 狀態，不直接持久化敏感 token。
- 登出時需清除 client 端 auth state 與相關暫存資料（例如 timeline store cache）。

---

## Mastodon API 介接方式

### Integration Goal

- client 不直接呼叫 Mastodon OAuth/token 端點。
- 所有敏感資訊（client secret、access token）只存在 server 端。
- 前端只與本專案的 server API 溝通。

### Phase A（目前單一帳號）

此階段先沿用既有做法：

- 由 server runtime config 提供固定 access token。
- 前端「登入」動作視為建立本地 session 狀態（isAuthenticated = true）。
- 前端「登出」動作視為清除本地 session 狀態（isAuthenticated = false）。

建議 server endpoints：

- `POST /api/auth/login`
  - 行為：驗證目前 server 端 token 可用性（可透過呼叫 Mastodon `GET /api/v1/accounts/verify_credentials`）
  - 成功：回傳 account 基本資料與已登入狀態
  - 失敗：回傳 401/500 與錯誤訊息
- `POST /api/auth/logout`
  - 行為：清除本地 session（若使用 cookie/session）
  - 成功：回傳 logout success

備註：

- 因 token 固定在 server 端，這不是完整 OAuth 登入，只是單一帳號模式的最小可用方案。
- 若 `verify_credentials` 失敗，應視為登入失敗並引導檢查環境變數。

### Phase B（未來正式 OAuth）

建議採 OAuth 2.0 Authorization Code + PKCE：

1. 前端呼叫 `POST /api/auth/mastodon/start`。
2. server 產生 `state`、`code_verifier`、`code_challenge`，回傳授權 URL。
3. 使用者前往 Mastodon 授權頁同意後，導回 `GET /auth/callback?code=...&state=...`。
4. server 驗證 state 後，向 Mastodon token endpoint 交換 access token。
5. server 呼叫 `GET /api/v1/accounts/verify_credentials` 取得帳號資訊。
6. server 建立本地 session（httpOnly cookie），前端導向 `/timelines`。

Mastodon 相關端點（參考）：

- `GET /oauth/authorize`（導向使用者授權）
- `POST /oauth/token`（交換 token）
- `POST /oauth/revoke`（可選，撤銷 token）
- `GET /api/v1/accounts/verify_credentials`（驗證登入帳號）

### Logout 與 Token 策略

- 單一帳號階段：以「清除本地 session」為主。
- OAuth 階段：
  - 必做：清除本地 session/cookie。
  - 選做：呼叫 Mastodon `POST /oauth/revoke` 撤銷 access token（若產品希望強制失效）。

### 單一帳號限制（本期）

- server 僅維護一組 token 與一個 account context。
- 若偵測到不同 account id，不做切換，直接回傳錯誤並提示目前版本不支援多帳號。

---

## Error Handling

- 登入 API 失敗：顯示錯誤 + 可重試
- 網路超時：顯示通用錯誤，建議重試
- 未授權（401/403）：視為未登入，導向 `/login`
- 登出 API 失敗：保留在當前頁並提示重試（避免誤判已登出）

---

## Security Requirements

- 不在 client local storage 明文保存 access token（若非必要）。
- 所有受保護資料請求需經 server 端代理，避免 token 暴露在瀏覽器。
- 登出後應防止以瀏覽器返回鍵直接看到受保護內容（至少需重新驗證 auth state）。

---

## Acceptance Criteria

1. 未登入時進入 `/timelines`，會被導向 `/login`。
2. 在 `/login` 執行登入成功後，會導向 `/timelines`。
3. 登入失敗時有錯誤訊息，且可再次嘗試登入。
4. 已登入狀態進入 `/login`，會被導向 `/timelines`。
5. 在 `/timelines` 觸發登出後，會導向 `/login`。
6. 登出後重新進入 `/timelines` 仍會被導向 `/login`。
7. 全流程僅支援單一帳號，無帳號切換 UI 與資料結構依賴。

---

## Future Extension

- 多帳號登入與切換
- OAuth PKCE 完整流程
- session refresh / token rotation
- 細緻權限與裝置管理
