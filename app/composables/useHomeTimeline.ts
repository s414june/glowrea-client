import type { TimelineStatus } from '~/shared/types/timeline'
import { fetchHomeTimelinePage } from '~/utils/api/timeline'

type HomeTimelineState = {
  items: Ref<TimelineStatus[]>
  isInitialLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  isRefreshing: Ref<boolean>
  initialError: Ref<string | null>
  loadMoreError: Ref<string | null>
  hasMore: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  loadInitial: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  retryInitial: () => Promise<void>
}

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String((error as { statusMessage?: string }).statusMessage || 'Timeline request failed.')
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Timeline request failed.'
}

function mergeUniqueById(current: TimelineStatus[], incoming: TimelineStatus[]): TimelineStatus[] {
  const map = new Map<string, TimelineStatus>()

  for (const item of current) {
    map.set(item.id, item)
  }

  for (const item of incoming) {
    map.set(item.id, item)
  }

  return Array.from(map.values())
}

export function useHomeTimeline(): HomeTimelineState {
  const items = ref<TimelineStatus[]>([])
  const nextMaxId = ref<string | null>(null)

  const isInitialLoading = ref(false)
  const isLoadingMore = ref(false)
  const isRefreshing = ref(false)

  const initialError = ref<string | null>(null)
  const loadMoreError = ref<string | null>(null)

  const hasMore = computed(() => Boolean(nextMaxId.value))
  const isEmpty = computed(() => !isInitialLoading.value && !initialError.value && items.value.length === 0)

  async function loadInitial(): Promise<void> {
    if (isInitialLoading.value) {
      return
    }

    isInitialLoading.value = true
    initialError.value = null
    loadMoreError.value = null

    try {
      const response = await fetchHomeTimelinePage()
      items.value = response.items
      nextMaxId.value = response.nextMaxId
    } catch (error: unknown) {
      initialError.value = normalizeError(error)
    } finally {
      isInitialLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (isLoadingMore.value || isInitialLoading.value || isRefreshing.value || !nextMaxId.value) {
      return
    }

    isLoadingMore.value = true
    loadMoreError.value = null

    try {
      const response = await fetchHomeTimelinePage(nextMaxId.value)
      items.value = mergeUniqueById(items.value, response.items)
      nextMaxId.value = response.nextMaxId
    } catch (error: unknown) {
      loadMoreError.value = normalizeError(error)
    } finally {
      isLoadingMore.value = false
    }
  }

  async function refresh(): Promise<void> {
    if (isRefreshing.value || isInitialLoading.value) {
      return
    }

    isRefreshing.value = true
    initialError.value = null
    loadMoreError.value = null

    try {
      const response = await fetchHomeTimelinePage()
      items.value = response.items
      nextMaxId.value = response.nextMaxId
    } catch (error: unknown) {
      initialError.value = normalizeError(error)
    } finally {
      isRefreshing.value = false
    }
  }

  async function retryInitial(): Promise<void> {
    await loadInitial()
  }

  return {
    items,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    initialError,
    loadMoreError,
    hasMore,
    isEmpty,
    loadInitial,
    loadMore,
    refresh,
    retryInitial
  }
}