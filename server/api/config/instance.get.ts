export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const base = runtimeConfig.mastodonApiBase || runtimeConfig.public.mastodonApiBase

  if (!base) {
    return { hostname: null }
  }

  try {
    const hostname = new URL(base).hostname
    return { hostname }
  } catch {
    return { hostname: null }
  }
})
