<script setup lang="ts">
import TimelineList from '~/components/timeline/TimelineList.vue'
import { useLocalTimeline } from '~/composables/useLocalTimeline'

const {
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
} = useLocalTimeline()

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function retryLoadMore(): Promise<void> {
  return loadMore()
}

onMounted(async () => {
  await loadInitial()

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (!entry?.isIntersecting) return
      void loadMore()
    },
    { root: null, rootMargin: '120px 0px', threshold: 0.1 },
  )

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
})

watch(sentinelRef, (element, previousElement) => {
  if (!observer) return

  if (previousElement) {
    observer.unobserve(previousElement)
  }

  if (element) {
    observer.observe(element)
  }
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <TimelineList
    :items="items"
    :is-initial-loading="isInitialLoading"
    :is-loading-more="isLoadingMore"
    :is-refreshing="isRefreshing"
    :is-empty="isEmpty"
    :has-more="hasMore"
    :initial-error="initialError"
    :load-more-error="loadMoreError"
    @refresh="refresh"
    @retry-initial="retryInitial"
    @retry-load-more="retryLoadMore"
  >
    <template #after-list>
      <div
        v-if="hasMore"
        ref="sentinelRef"
        aria-hidden="true"
        class="h-3"
      />
    </template>
  </TimelineList>
</template>
