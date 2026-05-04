<script setup lang="ts">
useSeoMeta({ title: '設定' })

const { settings, setTheme } = useAppSettings()

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟隨系統' },
]
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-6">
    <section class="timeline-card rounded-2xl p-6">
      <p class="text-sm font-medium text-[var(--text-main)] mb-3">色彩主題</p>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          :class="
            settings.theme === option.value
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'text-[var(--text-subtle)] border-[var(--surface-line)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
          "
          @click="setTheme(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>
  </main>
</template>
