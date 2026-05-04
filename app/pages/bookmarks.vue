<script setup lang="ts">
import TimelineList from '~/components/timeline/TimelineList.vue'
import { useBookmarks } from '~/composables/useBookmarks'

useSeoMeta({ title: '書籤' })

const { items, isInitialLoading, isLoadingMore, initialError, loadMoreError, hasMore, isEmpty, loadInitial, loadMore, retryInitial } = useBookmarks()

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await loadInitial()
  observer = new IntersectionObserver(
    (entries) => { if (entries[0]?.isIntersecting) void loadMore() },
    { root: null, rootMargin: '120px 0px', threshold: 0.1 },
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

watch(sentinelRef, (el, prev) => {
  if (!observer) return
  if (prev) observer.unobserve(prev)
  if (el) observer.observe(el)
})

onBeforeUnmount(() => { observer?.disconnect(); observer = null })
</script>

<template>
  <TimelineList
    :items="items"
    :is-initial-loading="isInitialLoading"
    :is-loading-more="isLoadingMore"
    :is-refreshing="false"
    :is-empty="isEmpty"
    :has-more="hasMore"
    :initial-error="initialError"
    :load-more-error="loadMoreError"
    empty-message="還沒有儲存任何書籤"
    @retry-initial="retryInitial"
    @retry-load-more="loadMore"
  >
    <template #after-list>
      <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />
    </template>
  </TimelineList>
</template>
