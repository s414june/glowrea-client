import type { TagInfo } from '#shared/types/tag'
import type { TimelineStatus } from '#shared/types/timeline'
import { fetchTagInfo, fetchTagTimeline, followTag, unfollowTag } from '~/utils/api/tags'

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

export function useTagPage(tagName: string) {
  const tagInfo = ref<TagInfo | null>(null)
  const items = ref<TimelineStatus[]>([])
  const nextMaxId = ref<string | null>(null)

  const isInfoLoading = ref(false)
  const isInitialLoading = ref(false)
  const isLoadingMore = ref(false)
  const isFollowLoading = ref(false)

  const infoError = ref<string | null>(null)
  const initialError = ref<string | null>(null)
  const loadMoreError = ref<string | null>(null)

  const hasMore = computed(() => Boolean(nextMaxId.value))
  const isEmpty = computed(() => !isInitialLoading.value && !initialError.value && items.value.length === 0)

  async function loadInfo(): Promise<void> {
    if (isInfoLoading.value) return
    isInfoLoading.value = true
    infoError.value = null
    try {
      tagInfo.value = await fetchTagInfo(tagName)
    } catch (e) {
      infoError.value = normalizeError(e)
    } finally {
      isInfoLoading.value = false
    }
  }

  async function loadInitial(): Promise<void> {
    if (isInitialLoading.value) return
    isInitialLoading.value = true
    initialError.value = null
    loadMoreError.value = null
    try {
      const res = await fetchTagTimeline(tagName)
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
      const res = await fetchTagTimeline(tagName, nextMaxId.value)
      items.value = mergeUniqueById(items.value, res.items)
      nextMaxId.value = res.nextMaxId
    } catch (e) {
      loadMoreError.value = normalizeError(e)
    } finally {
      isLoadingMore.value = false
    }
  }

  async function toggleFollow(): Promise<void> {
    if (!tagInfo.value || isFollowLoading.value) return
    isFollowLoading.value = true
    try {
      const isFollowing = tagInfo.value.following
      const updated = isFollowing ? await unfollowTag(tagName) : await followTag(tagName)
      tagInfo.value = updated
    } catch {
      // silent — UI doesn't reset so user knows action failed
    } finally {
      isFollowLoading.value = false
    }
  }

  return {
    tagInfo, items, hasMore, isEmpty,
    isInfoLoading, isInitialLoading, isLoadingMore, isFollowLoading,
    infoError, initialError, loadMoreError,
    loadInfo, loadInitial, loadMore, toggleFollow,
  }
}
