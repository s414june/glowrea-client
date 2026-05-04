import type { SearchResponse, HashtagItem } from '#shared/types/search'
import { fetchSearch } from '~/utils/api/search'
import { fetchTrendingTags } from '~/utils/api/trends'

type ExploreTab = 'statuses' | 'accounts' | 'hashtags'

type ExploreState = {
  query: Ref<string>
  activeTab: Ref<ExploreTab>
  searchResults: Ref<SearchResponse | null>
  isSearching: Ref<boolean>
  searchError: Ref<string | null>
  trendingTags: Ref<HashtagItem[]>
  isTrendsLoading: Ref<boolean>
  hasQuery: ComputedRef<boolean>
  search: () => void
  loadTrendingTags: () => Promise<void>
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

  // Immediate search (e.g. on Enter key)
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

    debounceTimer = setTimeout(() => {
      void performSearch(newVal.trim())
    }, 300)
  })

  async function loadTrendingTags(): Promise<void> {
    isTrendsLoading.value = true
    try {
      trendingTags.value = await fetchTrendingTags()
    } catch {
      // silently fail — spec says 趨勢 API 失敗靜默略過
      trendingTags.value = []
    } finally {
      isTrendsLoading.value = false
    }
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
    isTrendsLoading,
    hasQuery,
    search,
    loadTrendingTags,
  }
}
