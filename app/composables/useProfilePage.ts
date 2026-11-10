import type { ProfileSummary } from '#shared/types/profile'
import type { TimelineStatus } from '#shared/types/timeline'
import { fetchAccountProfile, fetchAccountStatuses, fetchProfileMe, fetchProfileStatuses } from '~/utils/api/profile'

export type ProfileTab = 'posts' | 'replies' | 'media'

type TabState = {
  items: Ref<TimelineStatus[]>
  nextMaxId: Ref<string | null>
  isLoadingMore: Ref<boolean>
  loadMoreError: Ref<string | null>
  hasMore: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
}

export type PublicProfileTarget = {
  instance: string
  account: string
}

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String((error as { statusMessage?: string }).statusMessage || 'Request failed.')
  }
  if (error instanceof Error) return error.message
  return 'Request failed.'
}

function mergeUniqueById(current: TimelineStatus[], incoming: TimelineStatus[]): TimelineStatus[] {
  const map = new Map<string, TimelineStatus>()
  for (const item of current) map.set(item.id, item)
  for (const item of incoming) map.set(item.id, item)
  return Array.from(map.values())
}

function makeTabState(isLoading: Ref<boolean>): TabState {
  const items = ref<TimelineStatus[]>([])
  const nextMaxId = ref<string | null>(null)
  const isLoadingMore = ref(false)
  const loadMoreError = ref<string | null>(null)
  const hasMore = computed(() => Boolean(nextMaxId.value))
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)
  return { items, nextMaxId, isLoadingMore, loadMoreError, hasMore, isEmpty }
}

export function useProfilePage(initialTab: ProfileTab = 'posts', publicTarget?: PublicProfileTarget) {
  const profile = ref<ProfileSummary | null>(null)
  const pinnedItems = ref<TimelineStatus[]>([])
  const activeTab = ref<ProfileTab>(initialTab)

  const isInitialLoading = ref(false)
  const isRefreshing = ref(false)
  const initialError = ref<string | null>(null)

  const postsTab = makeTabState(isInitialLoading)
  const repliesTab = makeTabState(isInitialLoading)
  const mediaTab = makeTabState(isInitialLoading)

  const currentTab = computed((): TabState => {
    if (activeTab.value === 'replies') return repliesTab
    if (activeTab.value === 'media') return mediaTab
    return postsTab
  })

  // Expose flattened current-tab state for the page
  const items = computed(() => currentTab.value.items.value)
  const hasMore = computed(() => currentTab.value.hasMore.value)
  const isEmpty = computed(() => currentTab.value.isEmpty.value)
  const isLoadingMore = computed(() => currentTab.value.isLoadingMore.value)
  const loadMoreError = computed(() => currentTab.value.loadMoreError.value)

  async function loadPinnedStatuses(): Promise<void> {
    try {
      const response = publicTarget
        ? await fetchAccountStatuses(publicTarget.instance, profile.value?.id || '', { pinned: true })
        : await fetchProfileStatuses({ pinned: true })
      pinnedItems.value = response.items
    } catch {
      pinnedItems.value = []
    }
  }

  async function fetchTab(tab: ProfileTab, maxId?: string): Promise<void> {
    const state = tab === 'replies' ? repliesTab : tab === 'media' ? mediaTab : postsTab
    const options = tab === 'posts'
      ? { maxId, excludeReplies: true }
      : tab === 'media'
        ? { maxId, onlyMedia: true }
        : { maxId }

    const response = publicTarget
      ? await fetchAccountStatuses(publicTarget.instance, profile.value?.id || '', options)
      : await fetchProfileStatuses(options)

    const regularItems = tab === 'posts'
      ? response.items.filter((item) => !pinnedItems.value.some((pinned) => pinned.id === item.id))
      : response.items

    if (tab === 'replies') {
      // Client-side filter: only keep posts that are replies
      const replyItems = regularItems.filter((s) => Boolean((s as TimelineStatus & { in_reply_to_id?: string | null }).in_reply_to_id))
      if (maxId) {
        state.items.value = mergeUniqueById(state.items.value, replyItems)
      } else {
        state.items.value = replyItems
      }
    } else {
      if (maxId) {
        state.items.value = mergeUniqueById(state.items.value, regularItems)
      } else {
        state.items.value = regularItems
      }
    }
    state.nextMaxId.value = response.nextMaxId
  }

  async function loadInitial(): Promise<void> {
    if (isInitialLoading.value) return
    isInitialLoading.value = true
    initialError.value = null

    try {
      if (publicTarget) {
        const profileResponse = await fetchAccountProfile(publicTarget.instance, publicTarget.account)
        profile.value = profileResponse.profile
        await loadPinnedStatuses()
        await fetchTab(activeTab.value)
      } else {
        const [meResponse] = await Promise.all([fetchProfileMe(), loadPinnedStatuses()])
        profile.value = meResponse.profile
        await fetchTab(activeTab.value)
      }
    } catch (error: unknown) {
      initialError.value = normalizeError(error)
    } finally {
      isInitialLoading.value = false
    }
  }

  async function loadTabIfEmpty(tab: ProfileTab): Promise<void> {
    const state = tab === 'replies' ? repliesTab : tab === 'media' ? mediaTab : postsTab
    if (state.items.value.length > 0 || isInitialLoading.value) return
    isInitialLoading.value = true
    try {
      if (tab === 'posts' && pinnedItems.value.length === 0) await loadPinnedStatuses()
      await fetchTab(tab)
    } catch (error: unknown) {
      initialError.value = normalizeError(error)
    } finally {
      isInitialLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    const state = currentTab.value
    if (state.isLoadingMore.value || isInitialLoading.value || !state.nextMaxId.value) return
    state.isLoadingMore.value = true
    state.loadMoreError.value = null
    try {
      await fetchTab(activeTab.value, state.nextMaxId.value)
    } catch (error: unknown) {
      state.loadMoreError.value = normalizeError(error)
    } finally {
      state.isLoadingMore.value = false
    }
  }

  async function refresh(): Promise<void> {
    if (isRefreshing.value || isInitialLoading.value) return
    isRefreshing.value = true
    initialError.value = null
    try {
      if (publicTarget) {
        const profileResponse = await fetchAccountProfile(publicTarget.instance, publicTarget.account)
        profile.value = profileResponse.profile
        await loadPinnedStatuses()
        await fetchTab(activeTab.value)
      } else {
        const [meResponse] = await Promise.all([fetchProfileMe(), loadPinnedStatuses()])
        profile.value = meResponse.profile
        await fetchTab(activeTab.value)
      }
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
    profile,
    pinnedItems,
    activeTab,
    loadTabIfEmpty,
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
    retryInitial,
  }
}
