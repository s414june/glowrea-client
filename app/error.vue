<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: is404.value ? '找不到頁面' : '發生錯誤' })

function handleBack(): void {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/home')
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-50 px-6 text-center">
    <p class="text-6xl font-bold text-stone-200">{{ error.statusCode }}</p>

    <template v-if="is404">
      <h1 class="text-xl font-semibold text-stone-800">找不到這個頁面</h1>
      <p class="max-w-xs text-sm text-stone-500">這個頁面不存在，或連結已失效。</p>
    </template>

    <template v-else>
      <h1 class="text-xl font-semibold text-stone-800">發生了一點問題</h1>
      <p class="max-w-xs text-sm text-stone-500">{{ error.message || '請稍後再試。' }}</p>
    </template>

    <div class="flex gap-3">
      <button
        class="rounded-full bg-stone-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        @click="handleBack"
      >
        回上一頁
      </button>
      <NuxtLink
        to="/home"
        class="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
      >
        回首頁
      </NuxtLink>
    </div>
  </div>
</template>
