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
  isTrendsLoading,
  hasQuery,
  search,
  loadTrendingTags,
} = useExplore()

onMounted(() => loadTrendingTags())

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') search()
}

function clearQuery(): void {
  query.value = ''
}

function trendingUses(tag: { history: { day: string; uses: string; accounts: string }[] }): number {
  return tag.history.slice(0, 2).reduce((sum, h) => sum + Number(h.uses), 0)
}

const tabs: { id: 'statuses' | 'accounts' | 'hashtags'; label: string }[] = [
  { id: 'statuses', label: '貼文' },
  { id: 'accounts', label: '帳號' },
  { id: 'hashtags', label: '標籤' },
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
      >
        ✕
      </button>
    </div>

    <!-- 搜尋結果 -->
    <template v-if="hasQuery">
      <!-- Tab 列 -->
      <div class="mb-4 border-b border-[var(--surface-line)] overflow-x-auto scrollbar-none">
        <nav class="flex min-w-max" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="home-tab"
            :class="activeTab === tab.id ? 'home-tab--active' : ''"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Loading -->
      <LoadingSkeleton v-if="isSearching" />

      <!-- Error -->
      <div v-else-if="searchError" class="timeline-card rounded-2xl p-6 text-center">
        <p class="text-sm text-rose-700">{{ searchError }}</p>
        <button
          class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
          @click="search"
        >
          重試
        </button>
      </div>

      <template v-else-if="searchResults">
        <!-- 貼文 Tab -->
        <div v-if="activeTab === 'statuses'" class="space-y-3">
          <template v-if="searchResults.statuses.length > 0">
            <StatusItem
              v-for="status in searchResults.statuses"
              :key="status.id"
              :status="status"
            />
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">找不到相關內容</p>
          </div>
        </div>

        <!-- 帳號 Tab -->
        <div v-else-if="activeTab === 'accounts'" class="space-y-2">
          <template v-if="searchResults.accounts.length > 0">
            <article
              v-for="account in searchResults.accounts"
              :key="account.id"
              class="timeline-card rounded-2xl p-4 flex items-start gap-3"
            >
              <img
                :src="account.avatar"
                :alt="`${account.displayName} 的頭像`"
                class="h-10 w-10 flex-shrink-0 rounded-full object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-sm text-[var(--text-main)] truncate">
                  {{ account.displayName || account.username }}
                </p>
                <p class="text-xs text-[var(--text-subtle)] truncate">@{{ account.acct }}</p>
                <p
                  v-if="account.note"
                  class="mt-1 line-clamp-2 text-xs text-[var(--text-subtle)]"
                  v-html="account.note"
                />
              </div>
            </article>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">找不到相關內容</p>
          </div>
        </div>

        <!-- 標籤 Tab -->
        <div v-else-if="activeTab === 'hashtags'" class="space-y-2">
          <template v-if="searchResults.hashtags.length > 0">
            <NuxtLink
              v-for="tag in searchResults.hashtags"
              :key="tag.name"
              :to="`/tags/${tag.name}`"
              class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block"
            >
              <span class="font-medium text-sm text-[var(--text-main)]">#{{ tag.name }}</span>
              <span class="text-xs text-[var(--text-subtle)]">
                {{ trendingUses(tag).toLocaleString('zh-TW') }} 則貼文
              </span>
            </NuxtLink>
          </template>
          <div v-else class="timeline-card rounded-2xl p-8 text-center">
            <p class="text-sm text-[var(--text-subtle)]">找不到相關內容</p>
          </div>
        </div>
      </template>
    </template>

    <!-- 趨勢標籤 -->
    <template v-else>
      <div class="mb-3 px-1">
        <h2 class="headline-font text-base font-semibold text-[var(--text-main)]">熱門標籤</h2>
      </div>

      <LoadingSkeleton v-if="isTrendsLoading" />

      <div v-else-if="trendingTags.length === 0" class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門標籤</p>
      </div>

      <div v-else class="space-y-2">
        <NuxtLink
          v-for="tag in trendingTags"
          :key="tag.name"
          :to="`/tags/${tag.name}`"
          class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block"
        >
          <span class="font-medium text-sm text-[var(--text-main)]">#{{ tag.name }}</span>
          <span class="text-xs text-[var(--text-subtle)]">
            {{ trendingUses(tag).toLocaleString('zh-TW') }} 則貼文
          </span>
        </NuxtLink>
      </div>
    </template>
  </main>
</template>
