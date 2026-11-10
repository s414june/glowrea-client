<script setup lang="ts">
import { provideExplore } from '~/composables/useExplore'

const route = useRoute()
const explore = provideExplore()
useSeoMeta({ title: '探索' })

const tabs = [
  { path: '/explore', label: '貼文' },
  { path: '/explore/accounts', label: '帳號' },
  { path: '/explore/tags', label: '標籤' },
  { path: '/explore/links', label: '連結' },
]

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') explore.search()
}

function clearQuery(): void {
  explore.query.value = ''
}

watch([explore.hasQuery, () => route.path], ([hasQuery, path]) => {
  if (hasQuery && path === '/explore/links') {
    void navigateTo('/explore', { replace: true })
  }
})

onMounted(() => explore.loadTrending())
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
    <div class="relative mb-4">
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-subtle)] pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        v-model="explore.query.value"
        type="text"
        placeholder="搜尋"
        class="w-full rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-card)] pl-10 pr-10 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        @keydown="onKeydown"
      />
      <button
        v-if="explore.hasQuery.value"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-main)]"
        aria-label="清除搜尋"
        @click="clearQuery"
      >✕</button>
    </div>

    <div class="mb-4 border-b border-[var(--surface-line)] overflow-x-auto scrollbar-none">
      <nav class="flex min-w-max" role="tablist" aria-label="探索分類">
        <NuxtLink
          v-for="tab in tabs"
          v-show="!explore.hasQuery.value || tab.path !== '/explore/links'"
          :key="tab.path"
          :to="tab.path"
          class="home-tab"
          :class="route.path === tab.path ? 'home-tab--active' : ''"
          role="tab"
          :aria-selected="route.path === tab.path"
        >{{ tab.label }}</NuxtLink>
      </nav>
    </div>

    <NuxtPage />
  </main>
</template>
