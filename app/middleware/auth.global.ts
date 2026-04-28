import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()

  const protectedPrefixes = [
    '/status',
    '/notifications',
    '/messages',
    '/profile',
    '/more',
    '/compose',
  ]

  const isProtected = protectedPrefixes.some((prefix) => {
    return to.path === prefix || to.path.startsWith(`${prefix}/`)
  })

  if (isProtected && !auth.isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && auth.isAuthenticated.value) {
    return navigateTo('/home')
  }
})
