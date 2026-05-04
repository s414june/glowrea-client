import type { NotificationItem } from '#shared/types/notification'
import { fetchNotificationsPage } from '~/utils/api/notifications'

type NotificationsState = {
  items: Ref<NotificationItem[]>
  isInitialLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  initialError: Ref<string | null>
  loadMoreError: Ref<string | null>
  hasMore: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  loadInitial: () => Promise<void>
  loadMore: () => Promise<void>
  retryInitial: () => Promise<void>
}

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String((error as { statusMessage?: string }).statusMessage || 'Request failed.')
  }
  if (error instanceof Error) return error.message
  return 'Request failed.'
}

export function useNotifications(): NotificationsState {
  const items = ref<NotificationItem[]>([])
  const nextMaxId = ref<string | null>(null)

  const isInitialLoading = ref(false)
  const isLoadingMore = ref(false)

  const initialError = ref<string | null>(null)
  const loadMoreError = ref<string | null>(null)

  const hasMore = computed(() => Boolean(nextMaxId.value))
  const isEmpty = computed(() => !isInitialLoading.value && !initialError.value && items.value.length === 0)

  async function loadInitial(): Promise<void> {
    if (isInitialLoading.value) return

    isInitialLoading.value = true
    initialError.value = null
    loadMoreError.value = null

    try {
      const response = await fetchNotificationsPage()
      items.value = response.items
      nextMaxId.value = response.nextMaxId
    } catch (error: unknown) {
      initialError.value = normalizeError(error)
    } finally {
      isInitialLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (isLoadingMore.value || isInitialLoading.value || !nextMaxId.value) return

    isLoadingMore.value = true
    loadMoreError.value = null

    try {
      const response = await fetchNotificationsPage(nextMaxId.value)
      const existingIds = new Set(items.value.map((i) => i.id))
      const incoming = response.items.filter((i) => !existingIds.has(i.id))
      items.value = [...items.value, ...incoming]
      nextMaxId.value = response.nextMaxId
    } catch (error: unknown) {
      loadMoreError.value = normalizeError(error)
    } finally {
      isLoadingMore.value = false
    }
  }

  async function retryInitial(): Promise<void> {
    await loadInitial()
  }

  return {
    items,
    isInitialLoading,
    isLoadingMore,
    initialError,
    loadMoreError,
    hasMore,
    isEmpty,
    loadInitial,
    loadMore,
    retryInitial,
  }
}
