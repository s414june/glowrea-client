import { useAuth } from './useAuth'

export type NavItem = {
  key: 'home' | 'notifications' | 'messages' | 'search' | 'explore' | 'profile' | 'more' | 'compose'
  label: string
  to: string
  icon: 'home' | 'notifications' | 'messages' | 'search' | 'explore' | 'profile' | 'more' | 'compose'
}

const navItems: NavItem[] = [
  { key: 'home', label: '首頁', to: '/home', icon: 'home' },
  { key: 'notifications', label: '通知', to: '/notifications', icon: 'notifications' },
  { key: 'messages', label: '私訊', to: '/messages', icon: 'messages' },
  { key: 'search', label: '搜尋', to: '/search', icon: 'search' },
  { key: 'explore', label: '探索', to: '/explore', icon: 'explore' },
  { key: 'profile', label: '個人檔案', to: '/profile', icon: 'profile' },
  { key: 'more', label: '更多', to: '/more', icon: 'more' },
  { key: 'compose', label: '發文', to: '/compose', icon: 'compose' },
]

// 登入後桌機側欄（compose 永遠排除，由 FAB 負責）
const AUTH_DESKTOP_KEYS = ['home', 'notifications', 'messages', 'search', 'explore', 'profile', 'more']
// 未登入桌機側欄：只保留無需驗證的頁籤
const GUEST_DESKTOP_KEYS = ['home', 'search', 'explore', 'more']

// 行動版頂部小圖示（more 按鈕由版面層單獨渲染）
const AUTH_MOBILE_TOP_KEYS = ['notifications', 'search', 'more']
const GUEST_MOBILE_TOP_KEYS = ['search', 'more']

// 行動版底部列
const AUTH_MOBILE_BOTTOM_ORDER = ['home', 'messages', 'compose', 'explore', 'profile']
const GUEST_MOBILE_BOTTOM_ORDER = ['home', 'search', 'explore']

export function useAppNavigation() {
  const { isAuthenticated } = useAuth()

  const desktopItems = computed(() => {
    const keys = isAuthenticated.value ? AUTH_DESKTOP_KEYS : GUEST_DESKTOP_KEYS
    return navItems.filter(i => keys.includes(i.key))
  })

  const mobileTopItems = computed(() => {
    const keys = isAuthenticated.value ? AUTH_MOBILE_TOP_KEYS : GUEST_MOBILE_TOP_KEYS
    return navItems.filter(i => keys.includes(i.key))
  })

  const mobileBottomItems = computed(() => {
    const order = isAuthenticated.value ? AUTH_MOBILE_BOTTOM_ORDER : GUEST_MOBILE_BOTTOM_ORDER
    return order
      .map(key => navItems.find(i => i.key === key))
      .filter((i): i is NavItem => i !== undefined)
  })

  return { desktopItems, mobileTopItems, mobileBottomItems }
}
