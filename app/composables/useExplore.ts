import type { SearchResponse, HashtagItem, AccountSummary, TrendingLink } from '#shared/types/search'
import type { TimelineStatus } from '#shared/types/timeline'
import { fetchSearch } from '~/utils/api/search'
import { fetchTrendingTags, fetchTrendingStatuses, fetchTrendingAccounts, fetchTrendingLinks } from '~/utils/api/trends'

type ExploreTab = 'statuses' | 'accounts' | 'hashtags' | 'links'

type ExploreState = {
  query: Ref<string>
  activeTab: Ref<ExploreTab>
  searchResults: Ref<SearchResponse | null>
  isSearching: Ref<boolean>
  searchError: Ref<string | null>
  trendingTags: Ref<HashtagItem[]>
  trendingStatuses: Ref<TimelineStatus[]>
  trendingAccounts: Ref<AccountSummary[]>
  trendingLinks: Ref<TrendingLink[]>
  isTrendsLoading: Ref<boolean>
  hasQuery: ComputedRef<boolean>
  search: () => void
  loadTrending: () => Promise<void>
}

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String((error as { statusMessage?: string }).statusMessage || 'Request failed.')
  }
  if (error instanceof Error) return error.message
  return 'Request failed.'
}

export function useExplore(): ExploreState {
  const query = ref('')
  const activeTab = ref<ExploreTab>('statuses')
  const searchResults = ref<SearchResponse | null>(null)
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)
  const trendingTags = ref<HashtagItem[]>([])
  const trendingStatuses = ref<TimelineStatus[]>([])
  const trendingAccounts = ref<AccountSummary[]>([])
  const trendingLinks = ref<TrendingLink[]>([])
  const isTrendsLoading = ref(false)

  const hasQuery = computed(() => query.value.trim().length > 0)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function performSearch(q: string): Promise<void> {
    isSearching.value = true
    searchError.value = null
    try {
      searchResults.value = await fetchSearch(q)
    } catch (error: unknown) {
      searchError.value = normalizeError(error)
      searchResults.value = null
    } finally {
      isSearching.value = false
    }
  }

  function search(): void {
    const q = query.value.trim()
    if (!q) {
      searchResults.value = null
      return
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    void performSearch(q)
  }

  watch(query, (newVal) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!newVal.trim()) {
      searchResults.value = null
      isSearching.value = false
      return
    }

    // 搜尋狀態下 links tab 不存在，切回 statuses
    if (activeTab.value === 'links') {
      activeTab.value = 'statuses'
    }

    debounceTimer = setTimeout(() => {
      void performSearch(newVal.trim())
    }, 300)
  })

  async function loadTrending(): Promise<void> {
    isTrendsLoading.value = true
    const [tags, statuses, accounts, links] = await Promise.allSettled([
      fetchTrendingTags(),
      fetchTrendingStatuses(),
      fetchTrendingAccounts(),
      fetchTrendingLinks(),
    ])
    trendingTags.value = tags.status === 'fulfilled' ? tags.value : []
    trendingStatuses.value = statuses.status === 'fulfilled' ? statuses.value : []
    trendingAccounts.value = accounts.status === 'fulfilled' ? accounts.value : []
    trendingLinks.value = links.status === 'fulfilled' ? links.value : []
    isTrendsLoading.value = false
  }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return {
    query,
    activeTab,
    searchResults,
    isSearching,
    searchError,
    trendingTags,
    trendingStatuses,
    trendingAccounts,
    trendingLinks,
    isTrendsLoading,
    hasQuery,
    search,
    loadTrending,
  }
}
