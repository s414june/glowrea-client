# Feature: Status Detail（貼文主頁）- 技術規格

## 目標

實作「點擊 timeline 貼文後進入貼文主頁」功能，並在 Nuxt 4 架構下維持目前專案的責任分層：

- route page：頁面層狀態與互動
- composable：資料載入與錯誤/重試流程
- api client：前端呼叫本地 server endpoint
- server api：代理 Mastodon API + session 驗證

---

## 路由設計

### 新增路由

- `app/pages/status/[id].vue`

### 路由規則

- path: `/status/:id`
- 套用既有全域 auth middleware（未登入導向 `/login`）
- 若 `id` 缺失或格式不合法，頁面顯示錯誤 state（不允許白頁）

---

## 檔案切分

### 前端（app）

- `app/pages/status/[id].vue`
  - 負責讀取 route param、觸發 `loadStatusDetail()`、呈現 loading/error/detail
- `app/composables/useStatusDetail.ts`
  - 管理主貼文與 context 狀態
  - 提供 `load`, `retry`, `refresh`
- `app/utils/api/status.ts`
  - 封裝 API 請求

### 元件（components）

- `app/components/status/DetailCard.vue`
  - 顯示主貼文內容
- `app/components/status/ContextList.vue`
  - 顯示 ancestors / descendants（初版可先 descendants）

### 後端（server）

- `server/api/timeline/status/[id].get.ts`
  - 代理 `GET /api/v1/statuses/:id`
- `server/api/timeline/status/[id]/context.get.ts`
  - 代理 `GET /api/v1/statuses/:id/context`

---

## 型別設計

共用型別放在 `shared/types/status.ts`。

```ts
export type StatusAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
}

export type StatusDetail = {
  id: string
  content: string
  createdAt: string
  mediaAttachments?: Array<{
    id: string
    type: 'image' | 'video' | 'gifv' | 'audio' | 'unknown'
    url: string
    previewUrl?: string
    description?: string | null
  }>
  account: StatusAccount
  reblog?: StatusDetail | null
}

export type StatusContext = {
  ancestors: StatusDetail[]
  descendants: StatusDetail[]
}

export type StatusDetailResponse = {
  status: StatusDetail
}

export type StatusContextResponse = {
  context: StatusContext
}
```

---

## API Contract

### 1) 取得主貼文

- Method: `GET`
- Path: `/api/timeline/status/:id`
- Response 200:

```json
{
  "status": {
    "id": "113000000000000001",
    "content": "<p>Hello world</p>",
    "createdAt": "2026-04-23T04:00:00.000Z",
    "mediaAttachments": [
      {
        "id": "m001",
        "type": "image",
        "url": "https://.../original.jpg",
        "previewUrl": "https://.../preview.jpg",
        "description": "Sunset over sea"
      }
    ],
    "account": {
      "id": "1001",
      "username": "alice",
      "acct": "alice",
      "displayName": "Alice",
      "avatar": "https://..."
    },
    "reblog": null
  }
}
```

### 2) 取得上下文

- Method: `GET`
- Path: `/api/timeline/status/:id/context`
- Response 200:

```json
{
  "context": {
    "ancestors": [],
    "descendants": []
  }
}
```

### 錯誤碼策略

- `401`: 未登入或 session 無效
- `404`: 貼文不存在或不可見
- `500`: 上游 API 或伺服器錯誤

### Media Mapping（Server）

- Mastodon `media_attachments` 需映射到 `mediaAttachments`。
- 首頁與詳情頁共用同一組映射規則，避免型別分叉。
- 詳情頁圖片顯示優先順序：
  1. `previewUrl`（列表與初次渲染）
  2. `url`（高解析度或點擊放大）

---

## 圖片顯示規格（Detail Page）

### 顯示範圍

- 主貼文 `DetailCard` 必須顯示 `type=image` 的附件。
- `ContextList` 初期可不顯示圖片（降低首版複雜度），後續再擴充。

### UI 行為

- 單張圖：以大圖區塊顯示，建議 16:9 或貼近原比例，限制最大高度避免吃滿畫面。
- 多張圖：初期採 2 欄網格（手機可 1 欄），最多顯示前 4 張，超出顯示數量標記。
- 每張圖需有 `alt`：
  - 優先 `description`
  - fallback 為「貼文圖片」

### 錯誤與 fallback

- 載入失敗顯示 placeholder 卡片，不顯示破圖 icon。
- 若圖片全失敗，主貼文內容仍需完整可讀。

### 效能建議

- 使用 lazy loading（`loading="lazy"`）。
- 先顯示 `previewUrl`，必要時再切原圖。

---

## 狀態管理（Composable）

`useStatusDetail()` 建議狀態：

```ts
type StatusDetailState = {
  status: Ref<StatusDetail | null>
  context: Ref<StatusContext | null>
  isLoading: Ref<boolean>
  isRefreshing: Ref<boolean>
  error: Ref<string | null>
  contextError: Ref<string | null>
  load: (id: string) => Promise<void>
  refresh: (id: string) => Promise<void>
  retry: (id: string) => Promise<void>
}
```

行為規則：

- `load`:
  - 並行請求 detail + context
  - detail 失敗 => `error`，整頁 error
  - context 失敗 => `contextError`，主貼文仍可顯示
- `refresh`:
  - 與 `load` 類似，但走 refresh UI
- `retry`:
  - 重新觸發 `load`

---

## 頁面渲染規則

`app/pages/status/[id].vue` 顯示優先序：

1. `isLoading && !status` -> Loading Skeleton
2. `error && !status` -> Error Block + Retry
3. `status` -> Detail Card
4. `status && contextError` -> 顯示非阻斷警告
5. `status && context` -> 顯示 Context List

---

## 與現有功能整合

### Timeline 點擊導頁

在 timeline item（目前 `StatusItem`）加入點擊導頁：

- `navigateTo(`/status/${status.id}`)`
- 若卡片內未來有互動按鈕，按鈕需 `stopPropagation` 避免誤導頁

### Session 保護

- 依賴既有 `app/middleware/auth.global.ts`
- server endpoint 沿用 `requireAuthSession(event)`

---

## 安全與內容渲染

- 主貼文內容為 HTML（Mastodon `content`）
- 若使用 `v-html`，需明確定義 sanitization 策略（建議引入 sanitizer 套件）
- server 端不得回傳 access token

---

## 實作階段

### Phase 1（最小可用）

- 新增 status detail route
- 新增 detail/context server API
- 顯示主貼文 + 基本錯誤狀態

### Phase 2（可用性強化）

- 加入 context 區塊（ancestors/descendants）
- 加入 refresh/retry 與 partial failure UI
- 加入主貼文圖片區塊與多圖排版

### Phase 3（體驗優化）

- Timeline 與 Detail 切換動畫
- context 視覺層次優化

---

## 驗收條件（技術）

1. 點擊 `/home` 任一貼文可導到 `/status/:id`。
2. `/api/timeline/status/:id` 未登入時回 `401`。
3. 主貼文成功、context 失敗時，頁面仍可看到主貼文。
4. `/status/:id` 無效 id 不會白頁，且有可理解錯誤訊息。
5. `pnpm dev` 下 TypeScript 無新增錯誤。
6. 貼文含圖片時，詳情頁可顯示圖片且不破版。
7. 圖片載入失敗時，主貼文文字內容仍可正常閱讀。
