# Feature: 更多 彈窗菜單（More Popover Menu）

## Goal

將導覽列的「更多」由路由連結改為觸發彈窗菜單（popover），讓不常用功能與工具操作集中收納於此，減少主導覽雜訊。

---

## Scope

### In Scope

- 桌機版（`>= 1024px`）左欄「更多」按鈕改為彈窗觸發器
- 手機版頂部列「更多」按鈕改為彈窗觸發器
- 彈窗菜單包含以下項目（依順序）：

| 項目 | 行為 | 路由 |
|------|------|------|
| 設定 | 導向路由 | `/settings` |
| 喜歡 | 導向路由 | `/likes` |
| 書籤 | 導向路由 | `/bookmarks` |
| 本站 | 導向路由 | `/local` |
| 聯邦 | 導向路由 | `/federated` |
| 列表 | 導向路由 | `/lists` |
| 標籤 | 導向路由 | `/tags` |
| 登出 | 執行登出動作 | — |

- 點選菜單項目後自動關閉彈窗
- 點選彈窗外部或按下 `Escape` 關閉彈窗
- 移除 `/more` 路由（`more` 項目不再是 `NuxtLink`）

### Out of Scope

- 各子頁面（設定、喜歡、書籤…）的功能實作
- 滑動手勢開關彈窗
- 登出確認 dialog（直接執行登出）

---

## User Story

作為使用者，我希望點擊「更多」時能快速看到更多功能選單，而不需要導向另一個頁面，並能在選取完畢或點選外部後讓菜單消失。

---

## User Flow

### 開啟菜單

1. 使用者點擊導覽列「更多」按鈕
2. 彈窗菜單出現（帶淡入動畫）
3. 若菜單已開啟，再次點擊「更多」則關閉菜單

### 選取功能

1. 使用者點擊菜單項目
2. 若為路由項目 → 關閉菜單並導向對應路由
3. 若為「登出」 → 關閉菜單並執行登出流程（呼叫 `POST /api/auth/logout`，清除 session，導向 `/`）

### 關閉菜單（不選）

1. 使用者點擊菜單外部 → 菜單關閉
2. 使用者按下 `Escape` → 菜單關閉

---

## Component Structure

```
app/
  components/
    layout/
      MorePopoverMenu.vue        ← 彈窗菜單本體（選項清單 + 動畫）
      AppSidebar.vue             ← 桌機版「更多」改為 button + MorePopoverMenu
  layouts/
    default.vue                  ← 手機版頂部列「更多」改為 button + MorePopoverMenu
  composables/
    useMoreMenu.ts               ← 彈窗開關狀態（isOpen、toggle、close）
```

---

## UI Requirements

### 共用彈窗外觀

- 背景：`bg-[#faf7f2]`（與 app shell 同色）
- 邊框：`border border-stone-200`
- 圓角：`rounded-2xl`
- 陰影：`shadow-lg`
- 寬度：固定 `w-52`（208px）
- 內距：`py-2`

### 選單項目樣式

- 每項：`flex items-center gap-3 px-4 py-2.5 text-sm`
- 圖示 + 文字，圖示尺寸 `h-4 w-4`
- Default 狀態：`text-stone-700`
- Hover 狀態：`bg-stone-100 text-stone-900`
- 登出項目：文字與 icon 改為 `text-red-600 hover:bg-red-50`
- 登出項目前應有分隔線（`border-t border-stone-200 mt-1 pt-1`）

### Active 路由指示

- 若目前 route 符合菜單中的某個路由項目，該項目顯示 `nav-active`（`color: var(--nav-accent)`）

### 桌機版定位

- 彈窗出現於「更多」按鈕的**右上方**（`bottom-0 left-full ml-2`，相對於 sidebar 觸發按鈕）
- 若未來 sidebar 靠右則改為 `right-full mr-2`

### 手機版定位

- 彈窗出現於頂部列「更多」圖示的**下方左對齊**（`top-full right-0 mt-1`）
- 彈窗最大寬度不超出螢幕

### 動畫

- 開啟：`transition opacity-0 → opacity-100 + scale-95 → scale-100`（`duration-150`）
- 關閉：反向動畫（`duration-100`）
- 使用 Vue `<Transition>` 元件包裹彈窗

### 彈窗關閉行為（點外側）

- 透過 `onClickOutside`（VueUse）或 `mousedown` 事件監聽，偵測點擊是否落在彈窗及觸發按鈕之外
- 使用 `v-if` 控制渲染（而非 `v-show`），確保 `Escape` 鍵監聽只在彈窗開啟時掛載

---

## State Management

### `useMoreMenu` composable

```ts
// 全域 singleton（useState）確保桌機版 / 手機版共用同一開關狀態
const isOpen = useState<boolean>('more-menu:open', () => false)

function toggle(): void { isOpen.value = !isOpen.value }
function close(): void  { isOpen.value = false }
function open(): void   { isOpen.value = true }
```

> 若桌機版和手機版同時渲染（不存在於此專案），需確保只有一個顯示；目前各裝置採互斥版型，共用 state 不會造成問題。

---

## Menu Item Definition

菜單項目定義於 `MorePopoverMenu.vue` 內部（不需要加入 `useAppNavigation`）：

```ts
type MoreMenuItem =
  | { type: 'link';   key: string; label: string; icon: LucideIcon; to: string }
  | { type: 'action'; key: string; label: string; icon: LucideIcon; action: () => void; danger?: true }
```

---

## Accessibility

- 觸發按鈕加上 `aria-expanded` 和 `aria-haspopup="menu"`
- 彈窗容器加上 `role="menu"`
- 各選項加上 `role="menuitem"`
- 按下 `Escape` 關閉菜單並將焦點歸還觸發按鈕

---

## Technical Notes

- `more` 的 `NavItem.to` 欄位保留但設為空字串 `''`，觸發器改用 `<button>` 而非 `<NuxtLink>`
- `useAppNavigation` 的 `NavItem` type 可擴充 `isPopover?: true` 欄位，讓 AppSidebar 和 default.vue 知道哪些項目改為 popover 模式而非路由模式
- 登出流程：呼叫 `$fetch('/api/auth/logout', { method: 'POST' })`，完成後 `navigateTo('/')`

---

## File Change Summary

| 檔案 | 變更說明 |
|------|---------|
| `app/components/layout/MorePopoverMenu.vue` | 新增，彈窗本體 |
| `app/composables/useMoreMenu.ts` | 新增，開關狀態 |
| `app/composables/useAppNavigation.ts` | `NavItem` 加 `isPopover?: true`；`more` 項目加上此旗標 |
| `app/components/layout/AppSidebar.vue` | `more` 項目改為 `<button>`，掛載 `MorePopoverMenu` |
| `app/layouts/default.vue` | 手機頂部列 `more` 項目改為 `<button>`，掛載 `MorePopoverMenu` |
| `docs/specs/app-shell-layout.md` | 更新「更多」說明，標記為彈窗模式 |
