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
  ]

  const isProtected = protectedPrefixes.some((prefix) => {
    return to.path === prefix || to.path.startsWith(`${prefix}/`)
  })

  if (isProtected && !auth.isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && auth.isAuthenticated.value) {
    return navigateTo('/timelines')
  }
})
