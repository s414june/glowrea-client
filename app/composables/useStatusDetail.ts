import type { StatusContext, StatusDetail } from '#shared/types/status'
import { fetchStatusContext, fetchStatusDetail } from '~/utils/api/status'

type StatusDetailState = {
  status: Ref<StatusDetail | null>
  context: Ref<StatusContext | null>
  isLoading: Ref<boolean>
  isRefreshing: Ref<boolean>
  error: Ref<string | null>
  contextError: Ref<string | null>
  load: (id: string) => Promise<void>
  refresh: (id: string) => Promise<void>
  retry: (id: string) => Promise<void>
}

function normalizeError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String((error as { statusMessage?: string }).statusMessage || fallback)
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function useStatusDetail(): StatusDetailState {
  const status = ref<StatusDetail | null>(null)
  const context = ref<StatusContext | null>(null)
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)
  const contextError = ref<string | null>(null)

  async function loadBase(id: string, asRefresh: boolean): Promise<void> {
    if (asRefresh) {
      if (isRefreshing.value) {
        return
      }
      isRefreshing.value = true
    } else {
      if (isLoading.value) {
        return
      }
      isLoading.value = true
    }

    error.value = null
    contextError.value = null

    const [statusResult, contextResult] = await Promise.allSettled([
      fetchStatusDetail(id),
      fetchStatusContext(id)
    ])

    if (statusResult.status === 'rejected') {
      error.value = normalizeError(statusResult.reason, 'Failed to fetch status detail.')
      status.value = null
      context.value = null
      if (asRefresh) {
        isRefreshing.value = false
      } else {
        isLoading.value = false
      }
      return
    }

    status.value = statusResult.value.status

    if (contextResult.status === 'fulfilled') {
      context.value = contextResult.value.context
    } else {
      contextError.value = normalizeError(contextResult.reason, 'Failed to fetch status context.')
      context.value = null
    }

    if (asRefresh) {
      isRefreshing.value = false
    } else {
      isLoading.value = false
    }
  }

  function load(id: string): Promise<void> {
    return loadBase(id, false)
  }

  function refresh(id: string): Promise<void> {
    return loadBase(id, true)
  }

  function retry(id: string): Promise<void> {
    return load(id)
  }

  return {
    status,
    context,
    isLoading,
    isRefreshing,
    error,
    contextError,
    load,
    refresh,
    retry
  }
}
