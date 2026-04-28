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

export function useAppNavigation() {
  const desktopItems = navItems.filter(i => i.key !== 'compose')
  const mobileTopItems = navItems.filter((item) => ['notifications', 'search', 'more'].includes(item.key))

  const mobileBottomOrder = ['home', 'messages', 'compose', 'explore', 'profile']
  const mobileBottomItems = mobileBottomOrder
    .map(key => navItems.find(i => i.key === key))
    .filter((i): i is NavItem => i !== undefined)

  return {
    desktopItems,
    mobileTopItems,
    mobileBottomItems
  }
}
