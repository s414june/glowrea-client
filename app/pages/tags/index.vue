<script setup lang="ts">
import type { TagInfo } from '#shared/types/tag'
import { fetchFollowedTags } from '~/utils/api/tags'
import { unfollowTag } from '~/utils/api/tags'

useSeoMeta({ title: '追蹤的標籤' })

const items = ref<TagInfo[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const unfollowingSet = ref<Set<string>>(new Set())

function normalizeError(e: unknown): string {
  if (typeof e === 'object' && e && 'statusMessage' in e)
    return String((e as { statusMessage?: string }).statusMessage || 'Request failed.')
  if (e instanceof Error) return e.message
  return 'Request failed.'
}

async function load() {
  if (isLoading.value) return
  isLoading.value = true
  error.value = null
  try {
    const res = await fetchFollowedTags()
    items.value = res.items
  } catch (e) {
    error.value = normalizeError(e)
  } finally {
    isLoading.value = false
  }
}

async function handleUnfollow(name: string) {
  unfollowingSet.value = new Set([...unfollowingSet.value, name])
  try {
    await unfollowTag(name)
    items.value = items.value.filter(t => t.name !== name)
  } finally {
    const next = new Set(unfollowingSet.value)
    next.delete(name)
    unfollowingSet.value = next
  }
}

onMounted(() => load())
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-4">
    <!-- 載入中 -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="timeline-card rounded-2xl p-4 flex items-center gap-3">
        <div class="h-5 w-1/3 rounded" :style="{ backgroundColor: 'var(--surface-line)' }" />
        <div class="ml-auto h-7 w-16 rounded-full" :style="{ backgroundColor: 'var(--surface-line)' }" />
      </div>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="timeline-card rounded-2xl p-8 text-center">
      <p class="mb-4 text-sm" :style="{ color: 'var(--text-subtle)' }">{{ error }}</p>
      <button
        class="rounded-lg px-4 py-2 text-sm font-medium text-white"
        :style="{ backgroundColor: 'var(--accent)' }"
        @click="load"
      >重試</button>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="items.length === 0" class="timeline-card rounded-2xl p-8 text-center">
      <p class="text-sm" :style="{ color: 'var(--text-subtle)' }">還沒有追蹤任何標籤</p>
      <p class="mt-1 text-xs" :style="{ color: 'var(--text-subtle)' }">點擊貼文中的 hashtag 即可進入標籤頁並追蹤</p>
    </div>

    <!-- 列表 -->
    <div v-else class="space-y-2">
      <div
        v-for="tag in items"
        :key="tag.name"
        class="timeline-card rounded-2xl p-4 flex items-center justify-between"
      >
        <NuxtLink
          :to="`/tags/${encodeURIComponent(tag.name)}`"
          class="font-medium text-sm transition-colors hover:underline"
          :style="{ color: 'var(--accent)' }"
        >#{{ tag.name }}</NuxtLink>

        <button
          :disabled="unfollowingSet.has(tag.name)"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
          :style="{ backgroundColor: 'var(--surface-line)', color: 'var(--text-main)' }"
          @click="handleUnfollow(tag.name)"
        >
          {{ unfollowingSet.has(tag.name) ? '取消中…' : '取消追蹤' }}
        </button>
      </div>
    </div>
  </main>
</template>
