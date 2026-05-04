import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()

  const protectedPrefixes = [
    '/timelines/messages',
    '/status',
    '/notifications',
    '/profile',
    '/more',
    '/compose',
    '/settings',
    '/likes',
    '/bookmarks',
    '/lists',
  ]

  // exact-only 保護：路徑完全相符才保護，子路由（如 /tags/:name）保持公開
  const protectedExact = ['/tags']

  const isProtected =
    protectedPrefixes.some((prefix) => to.path === prefix || to.path.startsWith(`${prefix}/`)) ||
    protectedExact.includes(to.path)

  if (isProtected && !auth.isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && auth.isAuthenticated.value) {
    return navigateTo('/timelines')
  }
})
