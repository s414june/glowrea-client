<script setup lang="ts">
useSeoMeta({ title: '設定' })
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-6">
    <section class="timeline-card rounded-2xl p-6">
      <p class="text-sm font-medium text-[var(--text-main)] mb-3">介面語言</p>
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium border bg-[var(--accent)] text-white border-[var(--accent)]"
        disabled
      >
        繁體中文
      </button>
      <p class="mt-2 text-xs text-[var(--text-subtle)]">v0 僅提供繁體中文，更多語言即將推出。</p>
    </section>
  </main>
</template>
