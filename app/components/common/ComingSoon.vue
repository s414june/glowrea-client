<script setup lang="ts">
defineProps<{
  /** 功能名稱，用於說明文字 */
  label?: string
}>()
</script>

<template>
  <main class="mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-24 text-center">
    <span class="text-4xl" aria-hidden="true">🚧</span>
    <h2 class="mt-5 text-lg font-semibold text-stone-800">即將推出</h2>
    <p class="mt-2 text-sm text-stone-500">
      {{ label ? `「${label}」` : '此功能' }}尚未開放，敬請期待。
    </p>
  </main>
</template>
