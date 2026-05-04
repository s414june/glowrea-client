<script setup lang="ts">
import TimelineList from '~/components/timeline/TimelineList.vue'
import { useFavourites } from '~/composables/useFavourites'

useSeoMeta({ title: '喜歡' })

const {
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
} = useFavourites()

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

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
  if (previousElement) observer.unobserve(previousElement)
  if (element) observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
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
    @retry-initial="retryInitial"
    @retry-load-more="loadMore"
  >
    <template #after-list>
      <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />
    </template>
  </TimelineList>
</template>
