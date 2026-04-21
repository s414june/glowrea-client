<script setup lang="ts">
import type { TimelineStatus } from '~/shared/types/timeline'

defineProps<{
  items: TimelineStatus[]
  isInitialLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean
  isEmpty: boolean
  hasMore: boolean
  initialError: string | null
  loadMoreError: string | null
}>()

defineEmits<{
  refresh: []
  retryInitial: []
  retryLoadMore: []
}>()
</script>

<template>
  <section class="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
    <header class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="headline-font text-2xl font-semibold text-stone-900 sm:text-3xl">
          Home Timeline
        </h1>
        <p class="mt-1 text-sm text-stone-600">
          你的去中心化社群動態
        </p>
      </div>

      <button
        class="rounded-xl border border-teal-600 bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
        :disabled="isRefreshing || isInitialLoading"
        @click="$emit('refresh')"
      >
        {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <LoadingSkeleton v-if="isInitialLoading && items.length === 0" />

    <div
      v-else-if="initialError && items.length === 0"
      class="timeline-card rounded-2xl p-6 text-center"
    >
      <p class="text-sm text-rose-700">
        {{ initialError }}
      </p>
      <button
        class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
        @click="$emit('retryInitial')"
      >
        Retry
      </button>
    </div>

    <div
      v-else-if="isEmpty"
      class="timeline-card rounded-2xl p-8 text-center"
    >
      <p class="text-sm text-stone-600">
        目前沒有任何貼文，稍後再回來看看。
      </p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <StatusItem
        v-for="item in items"
        :key="item.id"
        :status="item"
      />

      <div
        v-if="isLoadingMore"
        class="py-3 text-center text-sm text-stone-500"
      >
        載入更多中...
      </div>

      <div
        v-if="loadMoreError"
        class="timeline-card rounded-2xl p-4 text-center"
      >
        <p class="text-sm text-rose-700">
          {{ loadMoreError }}
        </p>
        <button
          class="mt-3 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
          @click="$emit('retryLoadMore')"
        >
          重試載入更多
        </button>
      </div>

      <slot name="after-list" />

      <p
        v-if="!hasMore && items.length > 0"
        class="py-2 text-center text-xs text-stone-400"
      >
        已經到底了
      </p>
    </div>
  </section>
</template>