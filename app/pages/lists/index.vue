<script setup lang="ts">
import { useLists } from '~/composables/useLists'

useSeoMeta({ title: '群組列表' })

const { items, isLoading, error, loadLists } = useLists()

onMounted(() => loadLists())
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-4">
    <!-- 載入中 -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="timeline-card rounded-2xl p-4 flex items-center gap-3">
        <div class="h-5 w-2/3 rounded" :style="{ backgroundColor: 'var(--surface-line)' }" />
        <div class="ml-auto h-4 w-4 rounded" :style="{ backgroundColor: 'var(--surface-line)' }" />
      </div>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="timeline-card rounded-2xl p-8 text-center">
      <p class="mb-4 text-sm" :style="{ color: 'var(--text-subtle)' }">{{ error }}</p>
      <button
        class="rounded-lg px-4 py-2 text-sm font-medium text-white"
        :style="{ backgroundColor: 'var(--accent)' }"
        @click="loadLists"
      >重試</button>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="items.length === 0" class="timeline-card rounded-2xl p-8 text-center">
      <p class="text-sm" :style="{ color: 'var(--text-subtle)' }">還沒有建立任何群組</p>
    </div>

    <!-- 列表 -->
    <div v-else class="space-y-2">
      <NuxtLink
        v-for="list in items"
        :key="list.id"
        :to="`/lists/${list.id}`"
        class="timeline-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)] transition-colors block"
      >
        <span class="font-medium text-sm" :style="{ color: 'var(--text-main)' }">{{ list.title }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-40 shrink-0" :style="{ color: 'var(--text-subtle)' }" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </NuxtLink>
    </div>
  </main>
</template>
