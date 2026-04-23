<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useHomeRefreshSignal } from '~/composables/useHomeRefreshSignal'

const auth = useAuth()
const route = useRoute()
const { signal } = useHomeRefreshSignal()
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

async function handleLogout(): Promise<void> {
  try {
    await auth.logout()
    await navigateTo('/login')
  } catch {
    // Error is exposed through auth.errorMessage.
  }
}

onMounted(async () => {
  if (signal.value > 0 && signal.value !== lastAppliedRefreshSignal.value) {
    lastAppliedRefreshSignal.value = signal.value
    await refresh()
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
  if (!value || value === previousValue) {
    return
  }

  if (route.path !== '/home') {
    return
  }

  lastAppliedRefreshSignal.value = value
  await refresh()
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
  <main>
    <section class="mx-auto w-full max-w-2xl px-4 pt-6 sm:pt-8">
      <div class="timeline-card flex items-center justify-between rounded-2xl px-4 py-3">
        <p class="text-xs text-stone-500 sm:text-sm">
          已登入狀態
        </p>

        <button
          class="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="auth.isLoading.value"
          @click="handleLogout"
        >
          {{ auth.isLoading.value ? '登出中...' : '登出' }}
        </button>
      </div>

      <p
        v-if="auth.errorMessage.value"
        class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
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
        <div
          v-if="hasMore"
          ref="sentinelRef"
          aria-hidden="true"
          class="h-3"
        />
      </template>
    </TimelineList>
  </main>
</template>