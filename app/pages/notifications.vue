<script setup lang="ts">
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import { useNotifications } from '~/composables/useNotifications'
import type { NotificationItem } from '#shared/types/notification'
import { resolveCustomEmojiText } from '~/utils/emoji'

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
const { openStatus } = useStatusNavigation()
const { profilePath } = useAccountNavigation()

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
  <main class="mx-auto w-full max-w-2xl lg:mx-0 lg:ml-6 px-2 py-4">
    <!-- Loading -->
    <LoadingSkeleton v-if="isInitialLoading" />

    <!-- Error -->
    <div
      v-else-if="initialError"
      class="timeline-card rounded-2xl p-6 text-center"
    >
      <p class="text-sm text-[var(--text-danger)]">{{ initialError }}</p>
      <button
        class="mt-4 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]"
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
    <div v-else class="space-y-2">
      <article
        v-for="item in items"
        :key="item.id"
        class="timeline-card rounded-2xl p-4"
      >
        <div class="flex items-start gap-3">
          <NuxtLink :to="profilePath(item.account)" class="shrink-0" :aria-label="`${item.account.displayName || item.account.username} 的個人頁`">
            <img
              :src="item.account.avatar"
              :alt="`${item.account.displayName} 的頭像`"
              class="h-10 w-10 rounded-full object-cover"
            />
          </NuxtLink>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-1">
              <NuxtLink :to="profilePath(item.account)" class="truncate text-sm font-semibold text-[var(--text-main)] hover:underline">
                <span v-html="resolveCustomEmojiText(item.account.displayName || item.account.username, item.account.emojis ?? [])" />
              </NuxtLink>
              <NuxtLink :to="profilePath(item.account)" class="truncate text-xs text-[var(--text-subtle)] hover:underline">
                @{{ item.account.acct }}
              </NuxtLink>
            </div>
            <p class="mt-0.5 text-sm text-[var(--text-subtle)]">
              {{ actionLabel[item.type] }}
              <span class="ml-1 text-xs">· {{ relativeTime(item.createdAt) }}</span>
            </p>
            <button
              v-if="item.status"
              type="button"
              class="mt-2 block w-full cursor-pointer line-clamp-2 border-l-2 border-[var(--surface-line)] pl-2 text-left text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)]"
              :aria-label="`開啟貼文：${stripHtml(item.status.content)}`"
              @click="openStatus(item.status)"
            >
              {{ stripHtml(item.status.content) }}
            </button>
          </div>
        </div>
      </article>

      <!-- Load more indicator -->
      <div v-if="isLoadingMore" class="py-3 text-center text-sm text-[var(--text-subtle)]">
        載入更多中...
      </div>

      <!-- Load more error -->
      <div v-if="loadMoreError" class="timeline-card rounded-2xl p-4 text-center">
        <p class="text-sm text-[var(--text-danger)]">{{ loadMoreError }}</p>
        <button
          class="mt-3 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]"
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
