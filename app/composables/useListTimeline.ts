import type { TimelineStatus } from '#shared/types/timeline'
import { fetchListTimeline } from '~/utils/api/lists'

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error)
    return String((error as { statusMessage?: string }).statusMessage || 'Request failed.')
  if (error instanceof Error) return error.message
  return 'Request failed.'
}

function mergeUniqueById(current: TimelineStatus[], incoming: TimelineStatus[]): TimelineStatus[] {
  const map = new Map<string, TimelineStatus>()
  for (const item of current) map.set(item.id, item)
  for (const item of incoming) map.set(item.id, item)
  return Array.from(map.values())
}

export function useListTimeline(listId: string) {
  const items = ref<TimelineStatus[]>([])
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
      const res = await fetchListTimeline(listId)
      items.value = res.items
      nextMaxId.value = res.nextMaxId
    } catch (e) {
      initialError.value = normalizeError(e)
    } finally {
      isInitialLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (isLoadingMore.value || isInitialLoading.value || !nextMaxId.value) return
    isLoadingMore.value = true
    loadMoreError.value = null
    try {
      const res = await fetchListTimeline(listId, nextMaxId.value)
      items.value = mergeUniqueById(items.value, res.items)
      nextMaxId.value = res.nextMaxId
    } catch (e) {
      loadMoreError.value = normalizeError(e)
    } finally {
      isLoadingMore.value = false
    }
  }

  return { items, isInitialLoading, isLoadingMore, initialError, loadMoreError, hasMore, isEmpty, loadInitial, loadMore }
}
