# Feature: App Shell Layout（左欄導覽）

## Goal

建立全站一致的 app shell 版型，提供固定左欄導覽，讓使用者在主要功能間快速切換。

此功能優先驗證：

- 左欄導覽資訊架構是否清楚
- route 導頁與 active 狀態是否正確
- 首頁與未來頁面是否可共用同一版型

---

## Scope

### In Scope

- 建立可重用的 layout（Nuxt layout）
- 左欄顯示以下項目：
  - Logo（點擊刷新頁面）
  - 首頁
  - 通知
  - 私訊
  - 搜尋
  - 探索
  - 個人檔案
  - 更多
- 每個導覽項目有 icon + label（初版 icon 可先用文字或 emoji 佔位）
- 支援 active route 樣式
- 支援桌機版主要體驗（左欄固定）
- 行動版採雙列導覽：
  - 頂部列：左上角 Logo；右側為 通知、搜尋、更多
  - 底部貼底功能列：首頁、私訊、發文（+ 圓形按鈕）、探索、個人檔案

### Out of Scope

- 完整通知頁、私訊頁、探索頁功能內容
- 複雜動畫與 micro-interaction
- 自訂主題切換（暗色模式等）
- 權限分級導覽控制

---

## User Story

作為使用者，我希望在任一頁都能看到固定導覽欄，能快速回首頁、切換功能頁，並透過 Logo 重新整理當前頁面。

---

## User Flow

1. 使用者登入後進入 app 內容頁（例如 `/home`）
2. 頁面套用 app shell layout
3. 左欄顯示品牌 Logo 與導覽清單
4. 使用者點擊任一導覽項目可切換對應 route
5. 使用者點擊 Logo 時，重新載入目前頁面
6. 當 route 改變時，左欄 active 項目同步更新

---

## Route Map（初版）

- 首頁 -> `/home`
- 通知 -> `/notifications`
- 私訊 -> `/messages`
- 搜尋 -> `/search`
- 探索 -> `/explore`
- 個人檔案 -> `/profile`
- 更多 -> 彈窗菜單（非路由，詳見 [more-popover-menu.md](more-popover-menu.md)）

備註：

- 若頁面尚未實作，可先導向對應 placeholder 頁面，顯示「Coming soon」。

---

## Layout Responsibility

- Layout 負責：
  - app shell 結構（左欄 + 主內容區）
  - 導覽項目渲染與 active 狀態
  - Logo 刷新互動
- Page 負責：
  - 各 route 的業務內容（timeline、status detail、notifications 等）

---

## UI Requirements

### Desktop（>= 1024px）

- 左欄固定（fixed）顯示於畫面左側
- 左欄寬度建議 `240px~280px`
- 中間主內容區需維持「相對整個視窗置中」，不可因左欄 fixed 而偏移
- 桌機導覽項目需顯示 icon + 文字（例如：首頁、通知、私訊）

### Tablet / Mobile（< 1024px）

- 左欄不顯示，改為上下兩區導覽。
- 頂部列（sticky top）：
  - 左側：Logo（點擊刷新當前頁）
  - 右側：通知、搜尋、更多
- 底部列（sticky bottom）：
  - 首頁、私訊、發文（`+` 圓形 accent 按鈕）、探索、個人檔案
  - 每項需有 icon 與文字（或初版文字）；發文按鈕只顯示 icon，無文字 label
- 頂部與底部導覽都需支援 active 樣式。
- 主內容需預留底部安全空間（避免被底部列遮住）。

### Navigation Item States

- Default：一般文字與 icon（`text-stone-700`）
- Hover：背景或文字顏色微調（`hover:bg-stone-100 hover:text-stone-900`）
- Active：**icon 與文字本身改為 accent 色（`--nav-accent`）**，不加底色背景
  - accent 色統一由 CSS 變數 `--nav-accent`（定義於 `main.css`）控制
  - 需要換色時只改 `--nav-accent` 即可，桌機左欄、手機頂部列、手機底部列全部同步生效
  - 對應 Tailwind utility class：`.nav-active`（`color: var(--nav-accent); font-weight: 600`）
- Disabled（可選）：尚未可用功能可先灰化或導向 placeholder

### Logo Interaction

- 點擊 Logo 執行目前 route 刷新
- 點擊 Logo 應導向 `/home` 並觸發 timeline refresh
- 不使用整頁 hard reload（避免中斷目前 app 狀態）
- 不可導致登入狀態遺失

---

## Technical Design

### 建議檔案

- `app/layouts/default.vue`
  - app shell 主結構
- `app/components/layout/AppSidebar.vue`
  - 左欄導航元件
- `app/composables/useAppNavigation.ts`（可選）
  - 導覽項目設定集中管理

### Navigation Config 建議

```ts
type NavItem = {
  key: 'home' | 'notifications' | 'messages' | 'search' | 'explore' | 'profile' | 'more'
  label: string
  to: string
  icon?: string
}
```

### Active 判斷規則

- `to === route.path` 視為 active
- 若未來有子路由，改用 `route.path.startsWith(to)`

---

## Error Handling

- 導覽至不存在頁面時：顯示 404 或 placeholder
- 刷新失敗（極少見）時：不應讓 app 崩潰

---

## Acceptance Criteria

1. 登入後進入 `/home` 可看到左欄導覽。
2. 左欄包含 Logo、首頁、通知、私訊、搜尋、探索、個人檔案、更多。
3. 點擊 Logo 會刷新目前頁面。
4. 點擊導覽項目會導向對應 route。
5. 當前 route 對應項目有 active 樣式。
6. 行動版顯示頂部列：左側 Logo、右側通知/搜尋/更多。
7. 行動版顯示底部貼底功能列：首頁/私訊/發文（+）/探索/個人檔案。
8. 行動版主內容不被底部功能列遮擋。

---

## Future Extension

- 導覽項目 badge（未讀通知數）
- 可收合側邊欄
- 使用者自訂導覽排序
- 更完整 icon 系統（Heroicons / Lucide）
