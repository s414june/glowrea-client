import { clearAuthSession } from '../../utils/auth-session'

export default defineEventHandler((event) => {
  clearAuthSession(event)

  return {
    success: true
  }
})
