<script setup lang="ts">
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'
import StatusItem from '~/components/timeline/StatusItem.vue'
import { useExplore } from '~/composables/useExplore'

const explore = useExplore()
</script>

<template>
  <template v-if="explore.hasQuery.value">
    <LoadingSkeleton v-if="explore.isSearching.value" />

    <div v-else-if="explore.searchError.value" class="timeline-card rounded-2xl p-6 text-center">
      <p class="text-sm text-rose-700">{{ explore.searchError.value }}</p>
      <button class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50" @click="explore.search">重試</button>
    </div>

    <template v-else-if="explore.searchResults.value">
      <div v-if="explore.searchResults.value.statuses.length" class="space-y-3">
        <StatusItem v-for="status in explore.searchResults.value.statuses" :key="status.id" :status="status" />
      </div>
      <div v-else class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">找不到相關貼文</p>
      </div>
    </template>
  </template>

  <template v-else>
    <LoadingSkeleton v-if="explore.isTrendsLoading.value" />
    <template v-else>
      <div v-if="explore.trendingStatuses.value.length" class="space-y-3">
        <StatusItem v-for="status in explore.trendingStatuses.value" :key="status.id" :status="status" />
      </div>
      <div v-else class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門貼文</p>
      </div>
    </template>
  </template>
</template>
