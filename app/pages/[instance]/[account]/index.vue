<script setup lang="ts">
import ProfileHeader from '~/components/profile/ProfileHeader.vue'
import StatusItem from '~/components/timeline/StatusItem.vue'
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import type { ProfileTab, PublicProfileTarget } from '~/composables/useProfilePage'
import type { TimelineStatus } from '#shared/types/timeline'

definePageMeta({ key: (route) => route.path })

const route = useRoute()
const headerVisible = useState<boolean>('header-visible', () => true)
const instance = computed(() => String(route.params.instance || '').toLowerCase())
const account = computed(() => String(route.params.account || '').replace(/^@/, ''))
const basePath = computed(() => `/${encodeURIComponent(instance.value)}/@${encodeURIComponent(account.value)}`)
const routeTab = computed<ProfileTab>(() => {
  if (route.query.tab === 'replies') return 'replies'
  if (route.query.tab === 'media') return 'media'
  return 'posts'
})

const target: PublicProfileTarget = { instance: instance.value, account: account.value }
const {
  profile,
  pinnedItems,
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
  retryInitial,
} = useProfilePage(routeTab.value, target)
const { openStatus } = useStatusNavigation()
const { profilePath } = useAccountNavigation()

const profileTitle = computed(() => {
  if (!profile.value) return '個人頁面'
  return profile.value.displayName?.trim() || profile.value.username
})
useSeoMeta({ title: profileTitle })

const tabs: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: '貼文' },
  { id: 'replies', label: '回覆' },
  { id: 'media', label: '媒體' },
]

watch(routeTab, async (tab, previousTab) => {
  if (tab === previousTab) return
  activeTab.value = tab
  await loadTabIfEmpty(tab)
})

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function firstImage(status: TimelineStatus): string | null {
  const image = (status.reblog ?? status).media_attachments?.find((media) => media.type === 'image' || media.type === 'gifv')
  return image?.preview_url ?? image?.url ?? null
}

function replyToAccount(status: TimelineStatus): { acct: string } | null {
  const reply = status as TimelineStatus & { in_reply_to_account_id?: string | null; mentions?: { id: string; acct: string }[] }
  if (!reply.in_reply_to_account_id) return null
  const mention = reply.mentions?.find((item) => item.id === reply.in_reply_to_account_id)
  return mention ? { acct: mention.acct } : null
}

function setupObserver(): void {
  observer?.disconnect()
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) void loadMore()
  }, { root: null, rootMargin: '120px 0px', threshold: 0.1 })
  if (sentinelRef.value) observer.observe(sentinelRef.value)
}

onMounted(async () => {
  await loadInitial()
  setupObserver()
})

watch(sentinelRef, (element, previous) => {
  if (!observer) return
  if (previous) observer.unobserve(previous)
  if (element) observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 pb-8 lg:mx-0 lg:ml-6">
    <div v-if="isInitialLoading && !profile" class="timeline-card mt-4 animate-pulse overflow-hidden rounded-2xl">
      <div class="h-36 w-full bg-[var(--surface-line)] sm:h-44" />
      <div class="px-5 pb-5">
        <div class="-mt-8 mb-3 h-16 w-16 rounded-full border-4 border-[var(--surface-card)] bg-[var(--surface-line)] sm:h-20 sm:w-20" />
        <div class="h-4 w-40 rounded bg-[var(--surface-line)]" />
        <div class="mt-2 h-3 w-24 rounded bg-[var(--surface-line)] opacity-60" />
        <div class="mt-3 space-y-2">
          <div class="h-3 w-full rounded bg-[var(--surface-line)] opacity-60" />
          <div class="h-3 w-5/6 rounded bg-[var(--surface-line)] opacity-60" />
        </div>
      </div>
    </div>

    <div v-else-if="initialError && !profile" class="timeline-card mt-4 rounded-2xl p-8 text-center">
      <p class="text-sm text-[var(--text-danger)]">{{ initialError }}</p>
      <button class="mt-4 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]" @click="retryInitial">
        重試
      </button>
    </div>

    <template v-else-if="profile">
      <div class="mt-4">
        <ProfileHeader :profile="profile" />
      </div>

      <div class="fixed inset-x-0 top-0 z-[19] border-b border-[var(--surface-line)] nav-bg-blur backdrop-blur transition-transform duration-300 ease-in-out lg:sticky lg:inset-x-auto lg:translate-y-0 lg:z-10" :class="headerVisible ? 'translate-y-16' : '-translate-y-full'">
        <div class="mx-auto w-full max-w-2xl overflow-x-auto px-4 scrollbar-none">
          <nav class="flex min-w-max" role="tablist" aria-label="個人檔案頁籤">
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.id"
              :to="tab.id === 'posts' ? basePath : { path: basePath, query: { tab: tab.id } }"
              class="home-tab"
              :class="activeTab === tab.id ? 'home-tab--active' : ''"
              role="tab"
              :aria-selected="activeTab === tab.id"
            >{{ tab.label }}</NuxtLink>
          </nav>
        </div>
      </div>

      <div class="mt-4">
        <div v-if="(isInitialLoading || (isRefreshing && items.length === 0)) && activeTab === 'media'" class="grid grid-cols-3 gap-0.5">
          <div v-for="n in 9" :key="n" class="aspect-square animate-pulse bg-[var(--surface-line)]" />
        </div>
        <LoadingSkeleton v-else-if="isInitialLoading || (isRefreshing && items.length === 0)" />

        <template v-else-if="activeTab === 'posts'">
          <div v-if="isEmpty && pinnedItems.length === 0" class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">尚無貼文</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in pinnedItems" :key="`pinned-${item.id}`">
              <p class="mb-1 px-1 text-xs font-medium text-[var(--accent)]">📌 置頂貼文</p>
              <StatusItem :status="item" />
            </div>
            <StatusItem v-for="item in items" :key="item.id" :status="item" />
          </div>
        </template>

        <template v-else-if="activeTab === 'replies'">
          <div v-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">尚無回覆</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in items" :key="item.id">
              <p v-if="replyToAccount(item)" class="mb-1 px-1 text-xs text-[var(--text-subtle)]">回覆了 <NuxtLink :to="profilePath(replyToAccount(item)!)" class="text-[var(--accent)] hover:underline">@{{ replyToAccount(item)!.acct }}</NuxtLink></p>
              <StatusItem :status="item" />
            </div>
          </div>
        </template>

        <template v-else>
          <div v-if="isEmpty" class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">尚無媒體貼文</p>
          </div>
          <div v-else class="grid grid-cols-3 gap-0.5">
            <template v-for="item in items" :key="item.id">
              <button
                v-if="firstImage(item)"
                type="button"
                class="aspect-square w-full overflow-hidden bg-[var(--surface-line)]"
                :aria-label="`開啟 ${item.account.display_name || item.account.username} 的貼文`"
                @click="openStatus(item, instance)"
              >
                <img :src="firstImage(item)!" :alt="`${(item.reblog ?? item).account.display_name} 的圖片`" class="h-full w-full object-cover" loading="lazy" />
              </button>
            </template>
          </div>
        </template>

        <template v-if="!isInitialLoading">
          <div v-if="isLoadingMore" class="py-3 text-center text-sm text-[var(--text-subtle)]">載入更多中...</div>
          <div v-if="loadMoreError" class="timeline-card mt-3 rounded-2xl p-4 text-center">
            <p class="text-sm text-[var(--text-danger)]">{{ loadMoreError }}</p>
            <button class="mt-3 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]" @click="loadMore">重試載入更多</button>
          </div>
          <div v-if="hasMore" ref="sentinelRef" aria-hidden="true" class="h-3" />
          <p v-if="!hasMore && items.length > 0" class="py-2 text-center text-xs text-[var(--text-subtle)]">已經到底了</p>
        </template>
      </div>
    </template>
  </main>
</template>
