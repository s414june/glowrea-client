<script setup lang="ts">
import TimelineList from '~/components/timeline/TimelineList.vue'
import { useListTimeline } from '~/composables/useListTimeline'
import { fetchListById } from '~/utils/api/lists'

const route = useRoute()
const id = String(route.params.id)

const listTitle = ref<string | null>(null)

useSeoMeta({ title: computed(() => listTitle.value ?? '群組時間軸') })

const { items, isInitialLoading, isLoadingMore, initialError, loadMoreError, hasMore, isEmpty, loadInitial, loadMore } = useListTimeline(id)

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await Promise.all([
    fetchListById(id).then(info => { listTitle.value = info.title }).catch(() => {}),
    loadInitial(),
  ])

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
  <div>
    <div class="mx-auto w-full max-w-2xl px-4 pt-4 pb-2">
      <h1 class="text-lg font-bold" :style="{ color: 'var(--text-main)' }">
        <span v-if="listTitle">{{ listTitle }}</span>
        <span v-else class="inline-block h-6 w-32 rounded align-middle" :style="{ backgroundColor: 'var(--surface-line)' }" />
      </h1>
    </div>
    <TimelineList
      :items="items"
      :is-initial-loading="isInitialLoading"
      :is-loading-more="isLoadingMore"
      :is-refreshing="false"
      :is-empty="isEmpty"
      :has-more="hasMore"
      :initial-error="initialError"
      :load-more-error="loadMoreError"
      empty-message="此群組目前沒有貼文"
      @retry-initial="loadInitial"
      @retry-load-more="loadMore"
    >
      <template #after-list>
        <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />
      </template>
    </TimelineList>
  </div>
</template>
