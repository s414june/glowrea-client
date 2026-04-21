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

1. 使用者登入成功後進入 `/home`
2. 頁面先顯示 loading state
3. API 成功回傳後，顯示 timeline 列表
4. 如果列表為空，顯示 empty state
5. 使用者向下捲動到底部時，可載入更多舊資料
6. 如果 API 發生錯誤，顯示 error state 與 retry 動作
7. 使用者可透過重新整理頁面或手動 retry 再次取得資料

---

## Route

### Path

- `/home`

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

- 頁面標題或明確的首頁識別
- timeline list 容器
- loading state
- empty state
- error state
- retry 操作入口

### Status Item

每一筆 status 至少顯示：

- 作者名稱或 handle
- 貼文內容
- 發文時間
- 是否為 reblog / boost（初期可先簡化為文字標示）
- avatar（可先用圖片或預設佔位）

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
type TimelineStatus = {
	id: string
	content: string
	createdAt: string
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
