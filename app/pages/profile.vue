<script setup lang="ts">
import ProfileHeader from '~/components/profile/ProfileHeader.vue'
import StatusItem from '~/components/timeline/StatusItem.vue'
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'

const route = useRoute()
const { signal } = useProfileRefreshSignal()
const lastAppliedSignal = ref(0)

const {
  profile,
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
} = useProfilePage()

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  if (signal.value > 0 && signal.value !== lastAppliedSignal.value) {
    lastAppliedSignal.value = signal.value
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
      if (entry?.isIntersecting) void loadMore()
    },
    { root: null, rootMargin: '120px 0px', threshold: 0.1 }
  )

  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

watch(sentinelRef, (element, prev) => {
  if (!observer) return
  if (prev) observer.unobserve(prev)
  if (element) observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(signal, async (value, previousValue) => {
  if (!value || value === previousValue) return
  if (route.path !== '/profile') return

  lastAppliedSignal.value = value
  if (items.value.length === 0) {
    await loadInitial()
  } else {
    await refresh()
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
    <!-- Loading skeleton for profile header -->
    <div v-if="isInitialLoading && !profile" class="timeline-card animate-pulse overflow-hidden rounded-2xl">
      <div class="h-36 w-full bg-stone-200 sm:h-44" />
      <div class="px-5 pb-5">
        <div class="-mt-8 mb-3 h-16 w-16 rounded-full border-4 border-[#fffdf9] bg-stone-200 sm:h-20 sm:w-20" />
        <div class="h-4 w-40 rounded bg-stone-200" />
        <div class="mt-2 h-3 w-24 rounded bg-stone-100" />
        <div class="mt-3 space-y-2">
          <div class="h-3 w-full rounded bg-stone-100" />
          <div class="h-3 w-5/6 rounded bg-stone-100" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="initialError && !profile" class="timeline-card rounded-2xl p-8 text-center">
      <p class="text-sm text-rose-700">{{ initialError }}</p>
      <button
        class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
        @click="retryInitial"
      >
        重試
      </button>
    </div>

    <!-- Profile content -->
    <template v-else-if="profile">
      <div class="mb-4 flex items-center justify-between">
        <ProfileHeader :profile="profile" class="flex-1" />
      </div>

      <LoadingSkeleton v-if="isInitialLoading" />

      <div v-else-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-stone-600">尚無貼文。</p>
      </div>

      <div v-else class="space-y-3">
        <StatusItem v-for="item in items" :key="item.id" :status="item" />

        <div v-if="isLoadingMore" class="py-3 text-center text-sm text-stone-500">
          載入更多中...
        </div>

        <div v-if="loadMoreError" class="timeline-card rounded-2xl p-4 text-center">
          <p class="text-sm text-rose-700">{{ loadMoreError }}</p>
          <button
            class="mt-3 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
            @click="loadMore"
          >
            重試載入更多
          </button>
        </div>

        <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />

        <p v-if="!hasMore && items.length > 0" class="py-2 text-center text-xs text-stone-400">
          已經到底了
        </p>
      </div>
    </template>
  </main>
</template>
