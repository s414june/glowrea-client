<script setup lang="ts">
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import StatusItem from '~/components/timeline/StatusItem.vue'
import { useExplore } from '~/composables/useExplore'

useSeoMeta({ title: '探索' })

const {
  query,
  activeTab,
  searchResults,
  isSearching,
  searchError,
  trendingTags,
  trendingStatuses,
  trendingAccounts,
  trendingLinks,
  isTrendsLoading,
  hasQuery,
  search,
  loadTrending,
} = useExplore()

onMounted(() => loadTrending())

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') search()
}

function clearQuery(): void {
  query.value = ''
}

function trendingUses(tag: { history: { day: string; uses: string; accounts: string }[] }): number {
  return tag.history.slice(0, 2).reduce((sum, h) => sum + Number(h.uses), 0)
}

function linkDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

const searchTabs = [
  { id: 'statuses' as const, label: '貼文' },
  { id: 'accounts' as const, label: '帳號' },
  { id: 'hashtags' as const, label: '標籤' },
]

const trendingTabs = [
  { id: 'statuses' as const, label: '貼文' },
  { id: 'accounts' as const, label: '帳號' },
  { id: 'hashtags' as const, label: '標籤' },
  { id: 'links' as const, label: '連結' },
]
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
    <!-- 搜尋框 -->
    <div class="relative mb-4">
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-subtle)] pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        v-model="query"
        type="text"
        placeholder="搜尋"
        class="w-full rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-card)] pl-10 pr-10 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        @keydown="onKeydown"
      />
      <button
        v-if="hasQuery"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-main)]"
        aria-label="清除搜尋"
        @click="clearQuery"
      >✕</button>
    </div>

    <!-- 搜尋狀態 -->
    <template v-if="hasQuery">
      <!-- Tab 列：3 個（無連結） -->
      <div class="mb-4 border-b border-[var(--surface-line)] overflow-x-auto scrollbar-none">
        <nav class="flex min-w-max" role="tablist">
          <button
            v-for="tab in searchTabs"
            :key="tab.id"
            class="home-tab"
            :class="activeTab === tab.id ? 'home-tab--active' : ''"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </nav>
      </div>

      <LoadingSkeleton v-if="isSearching" />

      <div v-else-if="searchError" class="timeline-card rounded-2xl p-6 text-center">
        <p class="text-sm text-rose-700">{{ searchError }}</p>
        <button class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50" @click="search">重試</button>
      </div>

      <template v-else-if="searchResults">
        <div v-if="activeTab === 'statuses'" class="space-y-3">
          <template v-if="searchResults.statuses.length > 0">
            <StatusItem v-for="status in searchResults.statuses" :key="status.id" :status="status" />
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">找不到相關貼文</p>
          </div>
        </div>

        <div v-else-if="activeTab === 'accounts'" class="space-y-2">
          <template v-if="searchResults.accounts.length > 0">
            <article v-for="account in searchResults.accounts" :key="account.id" class="timeline-card rounded-2xl p-4 flex items-start gap-3">
              <img :src="account.avatar" :alt="`${account.displayName} 的頭像`" class="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-sm text-[var(--text-main)] truncate">{{ account.displayName || account.username }}</p>
                <p class="text-xs text-[var(--text-subtle)] truncate">@{{ account.acct }}</p>
                <p v-if="account.note" class="mt-1 line-clamp-2 text-xs text-[var(--text-subtle)]" v-html="account.note" />
              </div>
            </article>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">找不到相關帳號</p>
          </div>
        </div>

        <div v-else-if="activeTab === 'hashtags'" class="space-y-2">
          <template v-if="searchResults.hashtags.length > 0">
            <NuxtLink v-for="tag in searchResults.hashtags" :key="tag.name" :to="`/tags/${tag.name}`" class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block">
              <span class="font-medium text-sm text-[var(--text-main)]">#{{ tag.name }}</span>
              <span class="text-xs text-[var(--text-subtle)]">{{ trendingUses(tag).toLocaleString('zh-TW') }} 則貼文</span>
            </NuxtLink>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">找不到相關標籤</p>
          </div>
        </div>
      </template>
    </template>

    <!-- 熱門內容（未搜尋時） -->
    <template v-else>
      <!-- Tab 列：4 個（含連結） -->
      <div class="mb-4 border-b border-[var(--surface-line)] overflow-x-auto scrollbar-none">
        <nav class="flex min-w-max" role="tablist">
          <button
            v-for="tab in trendingTabs"
            :key="tab.id"
            class="home-tab"
            :class="activeTab === tab.id ? 'home-tab--active' : ''"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </nav>
      </div>

      <LoadingSkeleton v-if="isTrendsLoading" />

      <template v-else>
        <!-- 熱門貼文 -->
        <div v-if="activeTab === 'statuses'" class="space-y-3">
          <template v-if="trendingStatuses.length > 0">
            <StatusItem v-for="status in trendingStatuses" :key="status.id" :status="status" />
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門貼文</p>
          </div>
        </div>

        <!-- 熱門帳號 -->
        <div v-else-if="activeTab === 'accounts'" class="space-y-2">
          <template v-if="trendingAccounts.length > 0">
            <NuxtLink v-for="account in trendingAccounts" :key="account.id" :to="account.url" target="_blank" rel="noopener noreferrer" class="timeline-card rounded-2xl p-4 flex items-start gap-3 hover:border-[var(--accent)] transition-colors block">
              <img :src="account.avatar" :alt="`${account.displayName} 的頭像`" class="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-sm text-[var(--text-main)] truncate">{{ account.displayName || account.username }}</p>
                <p class="text-xs text-[var(--text-subtle)] truncate">@{{ account.acct }}</p>
                <p v-if="account.note" class="mt-1 line-clamp-2 text-xs text-[var(--text-subtle)]" v-html="account.note" />
              </div>
            </NuxtLink>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門帳號</p>
          </div>
        </div>

        <!-- 熱門標籤 -->
        <div v-else-if="activeTab === 'hashtags'" class="space-y-2">
          <template v-if="trendingTags.length > 0">
            <NuxtLink v-for="tag in trendingTags" :key="tag.name" :to="`/tags/${tag.name}`" class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block">
              <span class="font-medium text-sm text-[var(--text-main)]">#{{ tag.name }}</span>
              <span class="text-xs text-[var(--text-subtle)]">{{ trendingUses(tag).toLocaleString('zh-TW') }} 則貼文</span>
            </NuxtLink>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門標籤</p>
          </div>
        </div>

        <!-- 熱門連結 -->
        <div v-else-if="activeTab === 'links'" class="space-y-2">
          <template v-if="trendingLinks.length > 0">
            <a
              v-for="link in trendingLinks"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="timeline-card rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-colors block"
            >
              <img v-if="link.image" :src="link.image" :alt="link.title" class="w-full h-36 object-cover" />
              <div class="p-4">
                <p class="font-semibold text-sm text-[var(--text-main)] line-clamp-2 leading-snug">{{ link.title }}</p>
                <p class="mt-1 text-xs text-[var(--text-subtle)]">
                  {{ link.providerName || linkDomain(link.url) }}
                  <span v-if="link.authorName"> · {{ link.authorName }}</span>
                </p>
              </div>
            </a>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門連結</p>
          </div>
        </div>
      </template>
    </template>
  </main>
</template>
