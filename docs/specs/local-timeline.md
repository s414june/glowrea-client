# Feature: 本站時間軸（Local Timeline）

## Goal

提供 Mastodon 本站公開時間軸（`/api/v1/timelines/public?local=true`），讓訪客與已登入使用者都能瀏覽此聯邦實例上的公開貼文。

這是第一個**無需登入即可存取**的時間軸，其 UI 結構與資料流與 Home Timeline 高度一致，應最大程度複用現有元件與 composable 架構。

---

## Scope

### In Scope

- 顯示本站公開時間軸（`local=true`）
- 訪客與已登入使用者均可瀏覽
- 首次載入資料
- 顯示 loading / empty / error state
- 支援載入更多（infinite scroll）
- 支援手動刷新
- 複用 `TimelineList`、`StatusItem`、`LoadingSkeleton` 等現有元件
- 登出後首頁 `/home` 的 ComingSoon 佔位改為顯示本站時間軸（同步升級）

### Out of Scope

- 已登入後的聯邦時間軸（federated，不含 `local=true`）—— 另立 feature
- Streaming 即時更新
- 媒體 viewer
- 貼文互動（reply / boost / favourite）
- content warning 展開細節

---

## User Story

作為尚未登入的訪客，我希望能在首頁以外看到此 Mastodon 實例的公開動態，了解社群氛圍，並決定是否加入；作為已登入使用者，我也能隨時切換查看本站的完整公開動態。

---

## User Flow

1. 使用者（訪客或已登入）進入 `/local`
2. 頁面先顯示 loading skeleton
3. API 成功回傳後，顯示本站貼文列表
4. 列表為空時顯示 empty state
5. 向下捲動到底部時，自動載入更多舊資料
6. API 發生錯誤時，顯示 error state 與 retry 按鈕
7. 登出狀態下的 `/home` 自動改顯示本站時間軸，不需跳轉路由

---

## Route

### Path

- `/:instance/local`（例如 `/g0v.social/local`、`/mastodon.social/local`）

### 設計說明：實例感知路由

本站時間軸在概念上屬於某一個 Mastodon **實例**，而非應用程式本身的功能頁。路由前綴帶有 instance host 可明確表達「你正在看哪個伺服器的本站」，並為未來多伺服器切換預留空間。

**本期（單一伺服器）**：
- 不支援 URL 中的實例切換，所有請求仍固定指向 `runtimeConfig.mastodonApiBase`
- 導覽連結固定生成為 `/${defaultInstance}/local`（例如 `/g0v.social/local`）
- 若 URL 中的 instance 與實際設定不符，server route 仍以 `mastodonApiBase` 為準（忽略 URL 參數），前端顯示警告或靜默略過
- `defaultInstance` 從 `runtimeConfig.public.mastodonApiBase` 的 hostname 取得（`new URL(base).hostname`）

**未來（多伺服器）**：
- `/:instance/local` 將 instance 傳入 server route query param
- server route 驗證 instance 是否在允許清單中，再對應呼叫該實例 API
- 可從側欄或選單切換 instance 並更新路由

### Route Responsibility

- 作為本站時間軸的入口頁
- 不在 route 層處理資料轉換邏輯
- 頁面只負責初始化與渲染

### Route Guard

- 無保護，訪客可直接存取

---

## 首頁（`/home`）狀態切換設計

`/home` 依據登入狀態與實例設定，**不跳轉路由**地切換顯示的時間軸元件：

```
isAuthenticated = true
  → <HomeTimeline>（追蹤時間軸，需登入）

isAuthenticated = false && hasInstance = true（目前永遠 true）
  → <LocalTimeline>（本站公開時間軸）

isAuthenticated = false && hasInstance = false
  → <FederatedTimeline>（聯邦公開時間軸，尚未開發 → ComingSoon）
```

`hasInstance` 定義：`runtimeConfig.public.mastodonApiBase` 有值即為 `true`。由於目前部署一律設定此值，訪客首頁永遠顯示本站時間軸。

此設計讓首頁在不同狀態下有意義的內容，避免登出後呈現空白或 ComingSoon 頁。

---

## UI Requirements

### 頁面標題區

- 顯示「本站」或「本站時間軸」標題（小型 section header）
- 不需返回按鈕

### Loading State

- 使用現有 `LoadingSkeleton` 元件（與 home timeline 一致）

### Empty State

- 顯示說明文字（例如：目前本站還沒有公開貼文）

### Error State

- 顯示錯誤訊息 + Retry 按鈕

### 列表

- 複用 `TimelineList` 元件
- Infinite scroll sentinel（`IntersectionObserver`），與 home timeline 一致

---

## 資料流

### API Endpoint

`GET /api/timeline/local`

query params：
- `maxId?: string`

### 對應 Mastodon API

```
GET /api/v1/timelines/public?local=true&limit=20[&max_id={maxId}]
```

不需要 Authorization header（公開端點）。

### 回傳格式

複用現有型別：

```ts
TimelinePageResponse = {
  items: TimelineStatus[]
  nextMaxId: string | null
}
```

### 分頁

Link header `rel="next"` → 解析 `max_id` 參數，與 home timeline 一致。

---

## 新增檔案

| 檔案 | 說明 |
|---|---|
| `server/api/timeline/local.get.ts` | Nitro API route，呼叫 Mastodon public timeline（local=true），不需驗證 |
| `app/utils/api/localTimeline.ts` | `fetchLocalTimelinePage(maxId?)` 前端 API helper |
| `app/composables/useLocalTimeline.ts` | 複用 `useHomeTimeline` 架構的 composable |
| `app/components/timeline/LocalTimeline.vue` | 封裝 useLocalTimeline + TimelineList 的共用元件 |
| `app/pages/[instance]/local.vue` | 本站時間軸頁面（動態 instance 參數） |

---

## 修改檔案

| 檔案 | 變更說明 |
|---|---|
| `app/pages/home.vue` | 訪客狀態依 `hasInstance` 切換 `<LocalTimeline>` 或 `<FederatedTimeline>`（後者暫為 ComingSoon） |
| `app/components/common/ComingSoon.vue` | 保留，供聯邦等尚未開發頁面使用 |
| `app/components/layout/MorePopoverMenu.vue` | 本站連結改為 `/${defaultInstance}/local` |
| `app/composables/useAppNavigation.ts` | 若有本站導覽項，連結改為動態 instance 路徑 |

---

## Server Route 規格

### `GET /api/timeline/local`

- 無需驗證（不呼叫 `requireRequestCredentials`）
- 從 `runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase` 取得實例 URL（**本期固定**，不依 URL 中的 instance 切換）
- 呼叫 `GET /api/v1/timelines/public?local=true&limit=20[&max_id=...]`
- 不帶 Authorization header
- 回傳 `TimelinePageResponse`
- 解析 Link header 取得 `nextMaxId`（複用 `parseNextMaxId` 邏輯）

> **本期限制**：URL 中的 `/:instance` 參數目前由前端自行計算（取 `mastodonApiBase` hostname），server route 不接收也不驗證此參數，一律使用設定值。

---

## Composable 規格：`useLocalTimeline`

與 `useHomeTimeline` 架構完全一致：

```ts
type LocalTimelineState = {
  items: Ref<TimelineStatus[]>
  isInitialLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  isRefreshing: Ref<boolean>
  initialError: Ref<string | null>
  loadMoreError: Ref<string | null>
  hasMore: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  loadInitial: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  retryInitial: () => Promise<void>
}
```

State key prefix：`local-timeline:`（避免與 home timeline state 衝突）

---

## `/home` 訪客模式升級

登出後 `/home` 不再顯示 `ComingSoon`，改為直接嵌入本站時間軸：

```vue
<!-- home.vue -->
<LocalTimeline v-if="!auth.isAuthenticated.value" />
<main v-else>... 追蹤時間軸 ...</main>
```

`LocalTimeline` 為獨立元件（`app/components/timeline/LocalTimeline.vue`），封裝 `useLocalTimeline` 與 `TimelineList` 的組合，供 `/home`（訪客）與 `/local`（所有人）複用。

---

## 錯誤處理

| 情境 | 行為 |
|---|---|
| Mastodon API 回傳非 2xx | 回傳對應 HTTP 狀態碼給前端 |
| `mastodonApiBase` 未設定 | 500 + 說明訊息 |
| 網路錯誤 | 前端顯示 error state + retry |
| 列表為空 | 顯示 empty state，不視為錯誤 |
