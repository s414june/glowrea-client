# Feature: 發文（Compose）入口

## Goal

在行動版底部功能列新增「發文」快捷按鈕，讓使用者一鍵進入發文頁面，降低創作門檻。

---

## Scope

### In Scope

- 行動版底部貼底功能列由 4 項擴充為 5 項，順序為：
  **首頁 → 私訊 → 發文 → 探索 → 個人檔案**
- 發文按鈕以圓形「+」圖示呈現，視覺上區別於其他導覽項目
- 點擊發文按鈕導向 `/compose`
- 桌機版右下角新增固定浮動按鈕（FAB），點擊同樣導向 `/compose`
- 新增 `app/pages/compose.vue`（初版為 placeholder 頁面）

### Out of Scope

- 發文頁的實際編輯功能（輸入框、媒體附件、送出 API）
- 桌機版發文入口
- 草稿儲存
- 引用/回覆轉跳帶入前文

---

## User Story

作為行動版使用者，我希望底部功能列有一個明顯的「+」按鈕，點擊後可快速進入發文頁面。

---

## User Flow

1. 使用者在行動版任一頁面看到底部功能列
2. 中央「+」按鈕視覺上突出（圓形背景、accent 色）
3. 點擊後導向 `/compose`
4. `/compose` 頁面顯示 placeholder 內容（「發文功能即將上線」）

---

## Route

- `/compose` — 發文頁（`app/pages/compose.vue`）
- 套用標準 default layout（`app/layouts/default.vue`）
- 需要登入（auth middleware 自動處理）

---

## UI Requirements

### 發文按鈕（行動版底部列）

- 位置：5 欄中央（第 3 欄）
- 外觀：圓形按鈕，背景 `bg-stone-200`、`text-stone-700`
- 尺寸：`h-10 w-10`（圓形）
- icon：Lucide `Plus`，`h-5 w-5`
- **不套用** `nav-active` / hover 背景色變化；hover 改為 `bg-stone-300`
- 沒有文字 label；加 `sr-only` 無障礙文字「發文」

### 發文 FAB（桌機版）

- 只在 `lg:` 以上顯示（`hidden lg:flex`）
- 位置：`fixed bottom-8 right-8 z-40`
- 外觀：圓形，背景 `bg-stone-200`、`text-stone-700`
- 尺寸：`h-14 w-14`
- icon：Lucide `Plus`，`h-6 w-6`
- hover：`bg-stone-300`，`shadow-md`
- 點擊導向 `/compose`

### 底部列 grid 調整

- `grid-cols-4` → `grid-cols-5`
- 發文按鈕欄使用 `flex items-center justify-center`（與其他項目相同，但按鈕本身是圓形 accent 樣式）

### Compose Placeholder 頁面

- 標題：「發文」
- 內容：「發文功能即將上線」提示文字
- 樣式與其他 placeholder 頁面一致

---

## Component / File Changes

| 檔案 | 變更說明 |
|------|---------|
| `app/composables/useAppNavigation.ts` | `mobileBottomItems` 加入 `compose`；新增 `compose` 到 `NavItem.key` union |
| `app/components/layout/navigationIcons.ts` | 加入 `compose: Plus` |
| `app/layouts/default.vue` | 底部列 `grid-cols-5`；`compose` 項目渲染為特殊圓形按鈕，不套用一般 nav 樣式 |
| `app/pages/compose.vue` | 新增 placeholder 頁面 |
| `docs/specs/app-shell-layout.md` | 更新行動版底部列說明 |

---

## Technical Notes

- `compose` 項目需在 `NavItem.key` union 裡加入，但因為樣式特殊，default.vue template 中應獨立判斷 `item.key === 'compose'` 渲染不同的按鈕結構
- 或者：`mobileBottomItems` 回傳時單獨標記，在 template 中以 `v-if` 分支渲染
- 兩種方案皆可，建議用 `item.key === 'compose'` 判斷（簡單、不需擴充 NavItem type）

---

## Acceptance Criteria

1. 行動版底部功能列顯示 5 個項目：首頁、私訊、發文（+）、探索、個人檔案。
2. 發文按鈕為圓形 accent 底色，其他 4 項保持原樣。
3. 點擊發文按鈕可導向 `/compose`。
4. `/compose` 頁面可正常渲染（不崩潰），顯示 placeholder 內容。
5. 桌機版右下角顯示圓形發文 FAB，點擊可導向 `/compose`。
