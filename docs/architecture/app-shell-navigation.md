# App Shell Navigation Architecture

## Overview

App Shell 導覽採用 Lucide icon 系統，並以「單一映射來源」管理 icon，避免在多個元件重複寫死圖示元件。

---

## Dependency

- package: `lucide-vue-next`
- purpose: 提供可組件化、可控制尺寸與樣式的 SVG icon

---

## Structure

### 1) Navigation Metadata

- file: `app/composables/useAppNavigation.ts`
- responsibility:
  - 定義導覽項目（key / label / to / icon）
  - 分組為桌機、手機頂部、手機底部

### 2) Icon Mapping Layer

- file: `app/components/layout/navigationIcons.ts`
- responsibility:
  - 將 `icon key` 映射到 Lucide component
  - 由 layout 元件透過 `<component :is="...">` 動態渲染

### 3) Render Layer

- file: `app/components/layout/AppSidebar.vue`
  - 桌機左欄 icon-only 導覽
- file: `app/layouts/default.vue`
  - 手機頂部列（通知/搜尋/更多）icon-only
  - 手機底部列（首頁/私訊/探索/個人檔案）icon-only

---

## Why This Design

- 一致性：所有 icon 來源一致，避免不同頁面 icon 風格不一。
- 可維護性：新增或替換 icon 只需改 mapping 檔，不需全域搜尋字串。
- 可擴充性：未來可加入 badge、動畫、狀態色彩而不改資料結構。

---

## Accessibility

即使 UI 改為 icon-only，仍需保留可存取資訊：

- 每個導覽按鈕需有 `aria-label`
- 補 `title` 供滑鼠使用者提示
- 使用 `sr-only` 保留文字語意
- active 狀態需有明確視覺差異

---

## Refresh Interaction

- Logo 點擊行為採「導向 `/home` + 觸發 timeline refresh signal」。
- signal 由 `useHomeRefreshSignal` 管理，`/home` 進入時與停留中都可響應 refresh。
- 避免整頁 reload，降低被 middleware 判定為未登入而導回 `/login` 的機率。

---

## Future Extensions

- 導覽 icon active 動畫
- 未讀數 badge（notifications/messages）
- 可設定 icon 尺寸 token 與主題色彩 token
