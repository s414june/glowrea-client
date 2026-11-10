<script setup lang="ts">
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import { useConversations } from '~/composables/useConversations'
import type { ConversationItem } from '#shared/types/conversation'
import { resolveCustomEmojiText } from '~/utils/emoji'

useSeoMeta({ title: '私人' })

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
} = useConversations()
const { openStatus } = useStatusNavigation()
const { profilePath } = useAccountNavigation()

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await loadInitial()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) void loadMore()
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

function participant(item: ConversationItem): ConversationItem['accounts'][number] | null {
  return item.accounts[0] ?? null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function relativeTime(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' })
  if (diff < 60) return rtf.format(-diff, 'second')
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour')
  return rtf.format(-Math.floor(diff / 86400), 'day')
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl lg:mx-0 lg:ml-6 px-2 py-4">
    <!-- Loading -->
    <LoadingSkeleton v-if="isInitialLoading" />

    <!-- Error -->
    <div v-else-if="initialError" class="timeline-card rounded-2xl p-6 text-center mx-2">
      <p class="text-sm text-[var(--text-danger)]">{{ initialError }}</p>
      <button
        class="mt-4 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]"
        @click="retryInitial"
      >
        重試
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center mx-2">
      <p class="text-sm text-[var(--text-subtle)]">目前沒有私人對話</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <article
        v-for="item in items"
        :key="item.id"
        class="timeline-card rounded-2xl p-4 flex items-start gap-3"
      >
        <!-- 未讀圓點 -->
        <div class="relative flex-shrink-0 mt-0.5">
          <NuxtLink v-if="participant(item)" :to="profilePath(participant(item)!)" class="block" :aria-label="`${participant(item)!.displayName || participant(item)!.username} 的個人頁`">
            <img
              :src="participant(item)!.avatar"
              :alt="`${participant(item)!.displayName || participant(item)!.username} 的頭像`"
              class="h-10 w-10 rounded-full object-cover"
            />
          </NuxtLink>
          <span
            v-if="item.unread"
            class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface-card)]"
            aria-label="未讀"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-baseline justify-between gap-2">
            <div class="flex flex-wrap items-baseline gap-x-1 min-w-0">
              <NuxtLink v-if="participant(item)" :to="profilePath(participant(item)!)" class="truncate text-sm font-semibold text-[var(--text-main)] hover:underline">
                <span v-if="participant(item)" v-html="resolveCustomEmojiText(participant(item)!.displayName || participant(item)!.username, participant(item)!.emojis ?? [])" />
                <span v-else>未知使用者</span>
              </NuxtLink>
              <NuxtLink v-if="participant(item)" :to="profilePath(participant(item)!)" class="truncate text-xs text-[var(--text-subtle)] hover:underline">
                @{{ participant(item)!.acct }}
              </NuxtLink>
            </div>
            <span v-if="item.lastStatus" class="flex-shrink-0 text-xs text-[var(--text-subtle)]">
              {{ relativeTime(item.lastStatus.created_at) }}
            </span>
          </div>

          <button
            v-if="item.lastStatus"
            type="button"
            class="mt-1 block w-full cursor-pointer line-clamp-2 text-left text-xs hover:text-[var(--text-main)]"
            :class="item.unread ? 'text-[var(--text-main)] font-medium' : 'text-[var(--text-subtle)]'"
            :aria-label="`開啟貼文：${stripHtml(item.lastStatus.content)}`"
            @click="openStatus(item.lastStatus)"
          >
            {{ stripHtml(item.lastStatus.content) }}
          </button>
          <p v-else class="mt-1 text-xs text-[var(--text-subtle)] italic">（無訊息）</p>
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
