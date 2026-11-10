<script setup lang="ts">
import { useExplore } from '~/composables/useExplore'

const explore = useExplore()

function trendingUses(tag: { history: { day: string; uses: string; accounts: string }[] }): number {
  return tag.history.slice(0, 2).reduce((sum, history) => sum + Number(history.uses), 0)
}
</script>

<template>
  <template v-if="explore.hasQuery.value">
    <LoadingSkeleton v-if="explore.isSearching.value" />
    <div v-else-if="explore.searchError.value" class="timeline-card rounded-2xl p-6 text-center">
      <p class="text-sm text-rose-700">{{ explore.searchError.value }}</p>
      <button class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50" @click="explore.search">重試</button>
    </div>
    <template v-else-if="explore.searchResults.value">
      <div v-if="explore.searchResults.value.hashtags.length" class="space-y-2">
        <NuxtLink v-for="tag in explore.searchResults.value.hashtags" :key="tag.name" :to="`/tags/${tag.name}`" class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block">
          <span class="font-medium text-sm text-[var(--text-main)]">#{{ tag.name }}</span>
          <span class="text-xs text-[var(--text-subtle)]">{{ trendingUses(tag).toLocaleString('zh-TW') }} 則貼文</span>
        </NuxtLink>
      </div>
      <div v-else class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">找不到相關標籤</p>
      </div>
    </template>
  </template>

  <template v-else>
    <LoadingSkeleton v-if="explore.isTrendsLoading.value" />
    <template v-else>
      <div v-if="explore.trendingTags.value.length" class="space-y-2">
        <NuxtLink v-for="tag in explore.trendingTags.value" :key="tag.name" :to="`/tags/${tag.name}`" class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block">
          <span class="font-medium text-sm text-[var(--text-main)]">#{{ tag.name }}</span>
          <span class="text-xs text-[var(--text-subtle)]">{{ trendingUses(tag).toLocaleString('zh-TW') }} 則貼文</span>
        </NuxtLink>
      </div>
      <div v-else class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門標籤</p>
      </div>
    </template>
  </template>
</template>
