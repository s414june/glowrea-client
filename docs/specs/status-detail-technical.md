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
- 圖片比例策略：
  - 若寬高比 `> 16:9` 或 `< 9:16`，使用 `cover`（滿版），並在溢出方向兩端套用糊化漸層遮罩（見下方糊化規則）。
  - 若寬高比介於 `9:16 ~ 16:9`（含邊界），使用全顯示模式（不裁切、不留白），不套用遮罩。
  - 若 `previewUrl` 與原圖比例不同，須以原圖比例作最終判斷；遮罩方向同步更新。
- 糊化規則（`cover` 模式專用）：
  - 使用 CSS `mask-image` 線性漸層實作，對齊容器圓角（`rounded-xl`）最邊緣。
  - 橫向溢出（`ratio > 16:9`）：左右兩端各 3% 淡出至透明。
    ```
    linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)
    ```
  - 縱向溢出（`ratio < 9:16`）：上下兩端各 3% 淡出至透明。
    ```
    linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)
    ```
  - 同時設定 `-webkit-mask-image` 確保 Safari 相容。
  - 全顯示模式（`full`）不套用任何遮罩，行內 style 為空物件。
- 每張圖需有 `alt`：
  - 優先 `description`
  - fallback 為「貼文圖片」
- 點擊任意圖片可開啟燈箱（`ImageLightbox`），詳見下方燈箱規格。

### 共用元件要求

- 首頁卡片與詳情頁圖片區皆應使用 `StatusImageGallery`。
- 避免在 `StatusItem`、`DetailCard` 重複實作比例判斷與錯誤處理，降低規格漂移風險。
- `ImageLightbox` 由 `StatusImageGallery` 內部掛載，外部元件無需感知。

---

## 圖片燈箱規格（ImageLightbox）

### 元件位置

`app/components/status/ImageLightbox.vue`

### 觸發方式

點擊 `StatusImageGallery` 內任意圖片格子，以點擊的圖片索引開啟燈箱。

### 介面結構

#### 關閉按鈕
- 固定於視窗左上角（`fixed top-4 left-4`），z-index 高於燈箱主體。
- 圓形半透明背景，支援 `Escape` 鍵關閉。

#### 手機版（`< md`）
- 圖片區佔滿剩餘高度（`flex-1`），以 `object-contain` 顯示原圖，不裁切。
- 若有 `description`，於圖片下方顯示可滾動文字區塊（最大高度 `max-h-36`）。
- 多圖時，底部顯示指示點，可點擊切換；同時顯示左右箭頭按鈕。

#### 電腦版（`≥ md`）
- 左側圖片區佔滿寬度剩餘空間，圖片以 `max-h-screen object-contain` 垂直置中。
- 右側固定寬度（`w-72`）欄位，顯示 `description` 文字（可滾動）。
  - 若無 `description` 顯示「（無圖片描述）」斜體提示。
  - 僅單張圖且無 description 時，右欄不渲染。
- 多圖時，右欄底部顯示指示點；左右箭頭按鈕疊加於圖片區。

### 切換行為
- 鍵盤 `←` / `→` 切換圖片。
- 鍵盤 `Escape` 關閉燈箱。
- 點擊圖片以外的遮罩區域（`@click.self`）關閉燈箱。
- 切換圖片時，`description` 與 `url` 同步更新。

### 開啟 / 關閉副作用
- 開啟時：`document.body.style.overflow = 'hidden'`，防止背景滾動。
- 關閉時：還原 `overflow`。
- 元件使用 `<Teleport to="body">` 避免被父層 `overflow:hidden` 截切。

### Props

```ts
type LightboxImage = {
  id: string
  url: string           // 原圖 URL（燈箱顯示原圖）
  description?: string | null
}

defineProps<{
  images: LightboxImage[]
  initialIndex?: number  // 開啟時預設顯示的索引，預設 0
}>()
```

### Emits

```ts
defineEmits<{
  close: []
}>()
```

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
- 貼文 HTML 內容中的 `a` 連結同樣視為互動元素：點擊連結不可觸發卡片導頁
- `a` 連結應使用可辨識藍色樣式（含 hover 狀態），避免被誤認為一般內文

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
