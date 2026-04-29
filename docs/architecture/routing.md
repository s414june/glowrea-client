# Routing Architecture

See also: `docs/architecture/app-shell-navigation.md` for app shell navigation and Lucide icon rendering architecture.

## `/`（根路由）

- Role: 重導向入口，不直接渲染任何內容。
- 行為：`ensureSession()` 後根據登入狀態以 `replace: true` 導向：
  - 已登入 → `/timelines`
  - 未登入 → `/login`
- 使用 `replace: true` 避免在瀏覽記錄中留下根路由，防止返回後再次白頁。

## 受保護路由（Protected Routes）

下列路由前綴需登入，未登入時由 `auth.global.ts` middleware 統一導向 `/login`：

- `/timelines/messages`
- `/explore`
- `/status`
- `/notifications`
- `/profile`
- `/more`
- `/compose`

> `/timelines`（追蹤、本站、聯邦）訪客可存取。`/timelines/messages` 為唯一受保護的 timelines 子路由。

## `/timelines`（Parent Layout）

- Role: tabs layout + child page 容器。
- 包含頁籤列（追蹤／私訊／本站／聯邦）與 `<NuxtPage />`，不 sticky。
- Child routes：
  - `/timelines`（index）→ 追蹤時間軸，需登入
  - `/timelines/messages` → 私訊，需登入
  - `/timelines/:instance/local` → 本站時間軸，無需登入
  - `/timelines/federated` → 聯邦時間軸（ComingSoon），無需登入

## `/profile`

- Role: current user profile page after login.
- Owns: profile header rendering, wiring profile timeline load/retry/refresh/load-more interactions.
- Does not own: Mastodon response transformation, token/session validation logic, upstream API details.

## Responsibilities Split

- Route page: orchestrates states and interactions.
- Composable: controls loading, pagination, dedupe, and error recovery.
- API layer: calls local server endpoint and maps transport errors.
- Server endpoint: talks to Mastodon upstream with token from runtime config.

---

## Error Page（`app/error.vue`）

Nuxt 錯誤邊界頁面，負責處理所有未被路由捕捉的錯誤。

### 錯誤類型區分

| 狀況 | 處理方式 |
|------|----------|
| 未登入存取受保護路由 | `auth.global.ts` middleware 導向 `/login`，**不進入 error.vue** |
| 路由不存在（404） | Nuxt 拋出 `statusCode: 404`，進入 `error.vue` 顯示「找不到頁面」 |
| 其他 server 錯誤 | 進入 `error.vue` 顯示「發生了一點問題」與錯誤訊息 |

### UI 行為

- 顯示狀態碼（大字）與對應說明文字。
- 提供「回上一頁」（`history.back()`，fallback 為 `/timelines`）與「回首頁」連結。
- 不套用 `default.vue` layout（error page 獨立全頁顯示）。
