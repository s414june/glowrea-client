<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useHomeRefreshSignal } from '~/composables/useHomeRefreshSignal'

useSeoMeta({ title: '追蹤' })

const auth = useAuth()
const route = useRoute()
const { hasInstance, localPath } = useInstanceConfig()
const { signal } = useHomeRefreshSignal()

function guestRedirectDest(): string {
  return hasInstance.value && localPath.value ? localPath.value : '/timelines/federated'
}
const lastAppliedRefreshSignal = ref(0)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

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
  retryInitial
} = useHomeTimeline()

function retryLoadMore(): Promise<void> {
  return loadMore()
}

onMounted(async () => {
  if (!auth.isAuthenticated.value) {
    await navigateTo(guestRedirectDest(), { replace: true })
    return
  }

  if (signal.value > 0 && signal.value !== lastAppliedRefreshSignal.value) {
    lastAppliedRefreshSignal.value = signal.value
    if (items.value.length === 0) {
      await loadInitial()
    } else {
      await refresh()
    }
  } else {
    await loadInitial()
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (!entry?.isIntersecting) {
        return
      }

      void loadMore()
    },
    {
      root: null,
      rootMargin: '120px 0px',
      threshold: 0.1
    }
  )

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
})

watch(signal, async (value, previousValue) => {
  if (!auth.isAuthenticated.value) return
  if (!value || value === previousValue) {
    return
  }

  if (route.path !== '/timelines') {
    return
  }

  lastAppliedRefreshSignal.value = value
  if (items.value.length === 0) {
    await loadInitial()
  } else {
    await refresh()
  }
})

watch(sentinelRef, (element, previousElement) => {
  if (!observer) {
    return
  }

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
  <!-- 已登入 → 追蹤時間軸 -->
  <main>
    <section v-if="auth.errorMessage.value" class="mx-auto w-full max-w-2xl px-4 pt-4">
      <p class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ auth.errorMessage.value }}
      </p>
    </section>
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
        <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />
      </template>
    </TimelineList>
  </main>
</template>
