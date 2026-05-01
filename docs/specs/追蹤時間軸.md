# 本專案重點

建立一個 去中心化社群的 Mastodon 第三方網頁應用程式，UI可參考Elk.zone的風格（簡約、文青）

# Feature: Home Timeline

## Goal

提供登入後的首頁時間軸，讓使用者可以瀏覽 Mastodon home timeline，並支援基本的載入、刷新、分頁與錯誤處理。

這個功能應作為整個專案的第一個核心 feature，優先驗證以下幾件事：

- route 與 feature 的責任切分是否清楚
- API client 與畫面狀態是否能正確配合
- timeline 類型的 UI 與資料流是否適合後續重用到 profile / thread / notifications 等功能

---

## Scope

### In Scope

- 顯示登入後的 home timeline
- 首次載入資料
- 顯示 loading / empty / error state
- 支援載入更多（infinite scroll）
- 支援手動刷新或重新取得最新資料
- 基本的 status item 顯示
- 基本去重處理，避免重複 status 出現在列表中

### Out of Scope

- 即時 streaming 更新
- 多帳號切換
- bookmark / favourite / boost / reply 等完整互動
- media viewer
- content warning 展開細節
- timeline filter / list timeline / federated timeline
- 離線快取
- 複雜動畫與完整 design system

---

## User Story

作為已登入的使用者，我希望一進入首頁就能看到我的 home timeline，並能順暢地往下瀏覽更多內容；如果發生錯誤，我希望至少能知道出了什麼問題並重新嘗試。

---

## User Flow

1. 使用者登入成功後進入 `/timelines`
2. 頁面先顯示 loading state
3. API 成功回傳後，顯示 timeline 列表
4. 如果列表為空，顯示 empty state
5. 使用者向下捲動到底部時，可載入更多舊資料
6. 如果 API 發生錯誤，顯示 error state 與 retry 動作
7. 使用者可透過重新整理頁面或手動 retry 再次取得資料

---

## Route

### Path

- `/timelines`

### Route Responsibility

- 作為 home timeline 的入口頁
- 不在 route 層處理 timeline 資料轉換邏輯
- route 僅負責決定當前頁面與初始化 feature

### Query Params

目前先不使用 query params。  
未來若要支援更細的 timeline 定位或 debug，可再評估是否加入。

---

## UI Requirements

### Page Level

頁面需包含：

- 頁面最上方頁籤列（見下方）
- timeline list 容器
- loading state
- empty state
- error state
- retry 操作入口

### 首頁頁籤

首頁頂部顯示可左右滾動的頁籤列，切換不同時間軸視圖。

| 頁籤 | 路徑 | 可見條件 |
|------|------|----------|
| 追蹤 | `/timelines` | 僅登入 |
| 私訊 | `/timelines/messages` | 僅登入 |
| 本站 | `/timelines/{hostname}/local` | 登入與未登入（需 `hasInstance`） |
| 聯邦 | `/timelines/federated` | 登入與未登入 |

- 頁籤列**不 sticky**，隨頁面自由滑動。
- 頁籤列可橫向滾動（`overflow-x-auto scrollbar-none`），防止小螢幕折行。
- active 頁籤使用 `--nav-accent` 底線與文字色；追蹤、私訊僅登入後渲染。
- `本站` tab 僅在 `hasInstance === true` 時顯示；`聯邦` tab 永遠顯示。
- 頁籤內容尚未實作時，導向 `ComingSoon` 元件或展示暗示。
- `/timelines` 為 parent layout（`timelines.vue`），tabs 與 `<NuxtPage />` 組成，各 tab 為獨立子頁面：
  - `timelines/index.vue`（追蹤）
  - `timelines/messages.vue`（私訊）
  - `timelines/[instance]/local.vue`（本站）
  - `timelines/federated.vue`（聯邦）

### Status Item

每一筆 status 至少顯示：

- 作者名稱或 handle
- 貼文內容
- 發文時間
- 是否為 reblog / boost（初期可先簡化為文字標示）
- avatar（可先用圖片或預設佔位）
- 貼文圖片縮圖（若貼文含圖片）
- 若貼文內容含連結（`a`），需使用可辨識的藍色連結樣式，避免與一般文字混淆
- 點擊貼文內容中的連結時，不可觸發卡片導頁（需阻止冒泡）

### Status Image（首頁縮圖）

- 僅顯示 `media_attachments` 中 `type=image` 的媒體。
- 圖片顯示比例規則：
	- 若寬高比 `> 16:9` 或 `< 9:16`，使用 `cover`（滿版）。
	- 若寬高比介於 `9:16 ~ 16:9`（含邊界），使用全顯示模式（不裁切、不留白）。
- 多張圖：初期可先顯示前 1 張，並標示 `+N`；後續再擴充格狀排版。
- 若有 `preview_url`，首頁優先使用 `preview_url`，避免載入過大原圖。
- 若 `preview_url` 與原圖比例不同，比例判斷應以原圖為最終依據。
- 圖片載入失敗時：
	- 隱藏壞圖，不讓版面破版
	- 顯示簡易 fallback 區塊（例如「圖片載入失敗」）
- 若貼文無圖片，不保留空白圖片區塊。
- 首頁與詳情頁需共用同一個圖片展示元件（`StatusImageGallery`）以維持規則一致。

### Custom Emoji（自定義表符）

Mastodon 實例可定義自訂表符（`:shortcode:` 語法），貼文 `content` HTML 中以 `:shortcode:` 純文字出現，API 同時回傳 `emojis[]` 陣列提供圖片 URL。

- 每筆 status 的 `emojis` 欄位包含該貼文使用到的自訂表符清單。
- Client 端需在渲染 `content` 前，將 `:shortcode:` 替換為 `<img>` 內嵌圖片。
- 圖片以 `.custom-emoji` class 渲染，`height: 1.25em; width: auto; vertical-align: middle`，與文字對齊。
- 僅接受 `https://` 開頭的 emoji URL，避免注入風險。
- 若 `emojis` 為空或某個 shortcode 不存在對應紀錄，保留原始 `:shortcode:` 文字。
- 轉換邏輯封裝於 `app/utils/emoji.ts` 的 `resolveCustomEmoji(content, emojis)` 工具函式。

### Loading State

- 初次進入頁面時顯示 skeleton 或簡單 loading 文案
- 載入更多時，底部需有 loading indicator

### Empty State

- 當 timeline 無資料時顯示提示文案
- 不要顯示空白頁面

### Error State

- 顯示簡單錯誤訊息
- 提供 retry 按鈕
- 不要因單次請求失敗讓整個 app 崩潰

---

## Data Source

使用 Mastodon API：

- `GET /api/v1/timelines/home`

實際 base URL 與 access token 由 auth / api-client 模組處理，本 feature 不直接處理 token 儲存細節。

---

## Data Model

### Minimum Status Shape

以下為 home timeline 初期顯示所需的最小欄位，實際型別可依 API 回應再擴充：

```ts
type CustomEmoji = {
  shortcode: string
  url: string
  static_url: string
}

type TimelineStatus = {
	id: string
	content: string
	createdAt: string
	emojis?: CustomEmoji[]
	mediaAttachments?: Array<{
		id: string
		type: 'image' | 'video' | 'gifv' | 'audio' | 'unknown'
		url: string
		previewUrl?: string
		description?: string | null
	}> 
	account: {
		id: string
		username: string
		acct: string
		displayName: string
		avatar: string
	}
	reblog?: TimelineStatus | null
}
```

### Media Mapping Notes

- Mastodon `media_attachments` 建議映射為 `mediaAttachments`。
- 欄位對應建議：
	- `preview_url` -> `previewUrl`
	- `description` -> `description`（作為 `img alt` 候選）
- 若無 `description`，可 fallback 使用作者名稱 + 「貼文圖片」。
