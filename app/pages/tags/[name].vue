<script setup lang="ts">
import TimelineList from '~/components/timeline/TimelineList.vue'
import { useTagPage } from '~/composables/useTagPage'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const tagName = String(route.params.name)

useSeoMeta({ title: `#${tagName}` })

const { isAuthenticated } = useAuth()

const {
  tagInfo, items, hasMore, isEmpty,
  isInfoLoading, isInitialLoading, isLoadingMore, isFollowLoading,
  infoError, initialError, loadMoreError,
  loadInfo, loadInitial, loadMore, toggleFollow,
} = useTagPage(tagName)

// 計算最近 7 天總使用量
const recentUses = computed(() => {
  if (!tagInfo.value?.history?.length) return null
  return tagInfo.value.history.slice(0, 7).reduce((sum, h) => sum + parseInt(h.uses, 10), 0)
})

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await Promise.all([loadInfo(), loadInitial()])

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
    <!-- 標籤資訊標頭 -->
    <div
      class="border-b px-2 py-4"
      :style="{ borderColor: 'var(--surface-line)', backgroundColor: 'var(--surface-card)' }"
    >
      <div class="mx-auto w-full max-w-2xl px-2">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold" :style="{ color: 'var(--text-main)' }">#{{ tagName }}</h1>
            <p v-if="recentUses !== null" class="mt-0.5 text-sm" :style="{ color: 'var(--text-subtle)' }">
              近 7 天 {{ recentUses.toLocaleString() }} 則貼文
            </p>
            <p v-else-if="isInfoLoading" class="mt-1 h-4 w-32 rounded" :style="{ backgroundColor: 'var(--surface-line)' }" />
            <p v-else-if="infoError" class="mt-0.5 text-sm" :style="{ color: 'var(--text-subtle)' }">無法載入標籤資訊</p>
          </div>

          <!-- 追蹤按鈕（登入才顯示） -->
          <button
            v-if="isAuthenticated"
            :disabled="isInfoLoading || isFollowLoading"
            class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            :style="tagInfo?.following
              ? { backgroundColor: 'var(--surface-line)', color: 'var(--text-main)' }
              : { backgroundColor: 'var(--accent)', color: '#fff' }"
            @click="toggleFollow"
          >
            <span v-if="isFollowLoading">{{ tagInfo?.following ? '取消中…' : '追蹤中…' }}</span>
            <span v-else>{{ tagInfo?.following ? '已追蹤' : '追蹤' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 時間軸 -->
    <TimelineList
      :items="items"
      :is-initial-loading="isInitialLoading"
      :is-loading-more="isLoadingMore"
      :is-refreshing="false"
      :is-empty="isEmpty"
      :has-more="hasMore"
      :initial-error="initialError"
      :load-more-error="loadMoreError"
      :empty-message="`#${tagName} 目前沒有貼文`"
      @retry-initial="loadInitial"
      @retry-load-more="loadMore"
    >
      <template #after-list>
        <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />
      </template>
    </TimelineList>
  </div>
</template>
