<script setup lang="ts">
import ProfileHeader from '~/components/profile/ProfileHeader.vue'
import StatusItem from '~/components/timeline/StatusItem.vue'
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import type { ProfileTab } from '~/composables/useProfilePage'
import type { TimelineStatus } from '#shared/types/timeline'

const route = useRoute()
const { signal } = useProfileRefreshSignal()
const lastAppliedSignal = ref(0)
const headerVisible = useState<boolean>('header-visible', () => true)

const {
  profile,
  activeTab,
  loadTabIfEmpty,
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
  retryInitial,
} = useProfilePage()

const profileTitle = computed(() => {
  if (!profile.value) return '個人頁面'
  const name = profile.value.displayName?.trim() || profile.value.username
  return name
})
useSeoMeta({ title: profileTitle })

const tabs: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: '貼文' },
  { id: 'replies', label: '回覆' },
  { id: 'media', label: '媒體' },
]

async function switchTab(tab: ProfileTab): Promise<void> {
  activeTab.value = tab
  await loadTabIfEmpty(tab)
}

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver(): void {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) void loadMore()
    },
    { root: null, rootMargin: '120px 0px', threshold: 0.1 },
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
}

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
  setupObserver()
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

// Media tab helpers
function firstImage(status: TimelineStatus): string | null {
  const img = (status.reblog ?? status).media_attachments?.find(
    (m) => m.type === 'image' || m.type === 'gifv',
  )
  return img?.preview_url ?? img?.url ?? null
}

function replyToHandle(status: TimelineStatus): string | null {
  const s = status as TimelineStatus & { in_reply_to_account_id?: string | null; mentions?: { id: string; acct: string }[] }
  if (!s.in_reply_to_account_id) return null
  const mention = s.mentions?.find((m) => m.id === s.in_reply_to_account_id)
  return mention ? `@${mention.acct}` : null
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 pb-8">
    <!-- Loading skeleton for profile header -->
    <div v-if="isInitialLoading && !profile" class="timeline-card animate-pulse overflow-hidden rounded-2xl mt-4">
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

    <!-- Error state (no profile) -->
    <div v-else-if="initialError && !profile" class="timeline-card rounded-2xl p-8 text-center mt-4">
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
      <!-- Profile header -->
      <div class="mt-4">
        <ProfileHeader :profile="profile" />
      </div>

      <!-- Tab nav — sticky below mobile header, sticky top-0 on desktop -->
      <div
        class="sticky top-16 z-[19] -mx-4 border-b border-stone-200 bg-[#faf7f2]/95 backdrop-blur xl:top-0"
      >
        <div class="overflow-x-auto scrollbar-none">
          <nav class="flex min-w-max" role="tablist" aria-label="個人檔案頁籤">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="home-tab"
              :class="activeTab === tab.id ? 'home-tab--active' : ''"
              role="tab"
              :aria-selected="activeTab === tab.id"
              @click="switchTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab content -->
      <div class="mt-4">
        <!-- Media tab skeleton -->
        <div v-if="(isInitialLoading || (isRefreshing && items.length === 0)) && activeTab === 'media'" class="grid grid-cols-3 gap-0.5">
          <div v-for="n in 9" :key="n" class="aspect-square animate-pulse bg-stone-200" />
        </div>
        <!-- Default skeleton -->
        <LoadingSkeleton v-else-if="isInitialLoading || (isRefreshing && items.length === 0)" />

        <!-- Posts tab -->
        <template v-else-if="activeTab === 'posts'">
          <div v-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">尚無貼文</p>
          </div>
          <div v-else class="space-y-3">
            <StatusItem v-for="item in items" :key="item.id" :status="item" />
          </div>
        </template>

        <!-- Replies tab -->
        <template v-else-if="activeTab === 'replies'">
          <div v-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">尚無回覆</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in items" :key="item.id">
              <p v-if="replyToHandle(item)" class="mb-1 px-1 text-xs text-[var(--text-subtle)]">
                回覆了 <span class="text-[var(--accent)]">{{ replyToHandle(item) }}</span>
              </p>
              <StatusItem :status="item" />
            </div>
          </div>
        </template>

        <!-- Media tab -->
        <template v-else-if="activeTab === 'media'">
          <div v-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">尚無媒體貼文</p>
          </div>
          <div v-else class="grid grid-cols-3 gap-0.5">
            <template v-for="item in items" :key="item.id">
              <div v-if="firstImage(item)" class="aspect-square overflow-hidden bg-stone-100">
                <img
                  :src="firstImage(item)!"
                  :alt="(item.reblog ?? item).account.display_name + ' 的圖片'"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </template>
          </div>
        </template>

        <!-- Load more -->
        <template v-if="!isInitialLoading">
          <div v-if="isLoadingMore" class="py-3 text-center text-sm text-[var(--text-subtle)]">
            載入更多中...
          </div>

          <div v-if="loadMoreError" class="timeline-card rounded-2xl p-4 text-center mt-3">
            <p class="text-sm text-rose-700">{{ loadMoreError }}</p>
            <button
              class="mt-3 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
              @click="loadMore"
            >
              重試載入更多
            </button>
          </div>

          <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />

          <p v-if="!hasMore && items.length > 0" class="py-2 text-center text-xs text-[var(--text-subtle)]">
            已經到底了
          </p>
        </template>
      </div>
    </template>
  </main>
</template>
