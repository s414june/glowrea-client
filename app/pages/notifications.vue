<script setup lang="ts">
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import { useNotifications } from '~/composables/useNotifications'
import type { NotificationItem } from '#shared/types/notification'

useSeoMeta({ title: '通知' })

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
} = useNotifications()

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

  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

watch(sentinelRef, (el, prev) => {
  if (!observer) return
  if (prev) observer.unobserve(prev)
  if (el) observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const actionLabel: Record<NotificationItem['type'], string> = {
  favourite: '喜歡了你的貼文',
  reblog: '轉發了你的貼文',
  follow: '開始追蹤你',
  mention: '提及了你',
}

function relativeTime(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' })
  if (diff < 60) return rtf.format(-diff, 'second')
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour')
  return rtf.format(-Math.floor(diff / 86400), 'day')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-2 py-4">
    <!-- Loading -->
    <LoadingSkeleton v-if="isInitialLoading" />

    <!-- Error -->
    <div
      v-else-if="initialError"
      class="timeline-card rounded-2xl p-6 text-center"
    >
      <p class="text-sm text-rose-700">{{ initialError }}</p>
      <button
        class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
        @click="retryInitial"
      >
        重試
      </button>
    </div>

    <!-- Empty -->
    <div
      v-else-if="isEmpty"
      class="timeline-card rounded-2xl p-8 text-center"
    >
      <p class="text-sm text-[var(--text-subtle)]">目前沒有通知</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-2 px-2">
      <article
        v-for="item in items"
        :key="item.id"
        class="timeline-card rounded-2xl p-4"
      >
        <div class="flex items-start gap-3">
          <img
            :src="item.account.avatar"
            :alt="`${item.account.displayName} 的頭像`"
            class="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-1">
              <span class="font-semibold text-sm text-[var(--text-main)] truncate">
                {{ item.account.displayName || item.account.username }}
              </span>
              <span class="text-xs text-[var(--text-subtle)] truncate">
                @{{ item.account.acct }}
              </span>
            </div>
            <p class="mt-0.5 text-sm text-[var(--text-subtle)]">
              {{ actionLabel[item.type] }}
              <span class="ml-1 text-xs">· {{ relativeTime(item.createdAt) }}</span>
            </p>
            <p
              v-if="item.status"
              class="mt-2 line-clamp-2 text-xs text-[var(--text-subtle)] border-l-2 border-[var(--surface-line)] pl-2"
            >
              {{ stripHtml(item.status.content) }}
            </p>
          </div>
        </div>
      </article>

      <!-- Load more indicator -->
      <div v-if="isLoadingMore" class="py-3 text-center text-sm text-[var(--text-subtle)]">
        載入更多中...
      </div>

      <!-- Load more error -->
      <div v-if="loadMoreError" class="timeline-card rounded-2xl p-4 text-center">
        <p class="text-sm text-rose-700">{{ loadMoreError }}</p>
        <button
          class="mt-3 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
          @click="loadMore"
        >
          重試載入更多
        </button>
      </div>

      <!-- Infinite scroll sentinel -->
      <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />

      <p v-if="!hasMore && items.length > 0" class="py-2 text-center text-xs text-[var(--text-subtle)]">
        已經到底了
      </p>
    </div>
  </main>
</template>
