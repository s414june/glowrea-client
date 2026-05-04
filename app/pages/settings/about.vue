<script setup lang="ts">
useSeoMeta({ title: '設定' })

const config = useRuntimeConfig()

const instanceHost = computed(() => {
  const base = config.public.mastodonApiBase
  if (!base) return null
  try {
    return new URL(base).hostname
  } catch {
    return base
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-6">
    <section class="timeline-card rounded-2xl divide-y divide-[var(--surface-line)]">
      <div class="flex justify-between items-center px-6 py-4 text-sm">
        <span class="text-[var(--text-subtle)]">應用程式</span>
        <span class="font-medium text-[var(--text-main)]">Glowrea</span>
      </div>
      <div class="flex justify-between items-center px-6 py-4 text-sm">
        <span class="text-[var(--text-subtle)]">版本</span>
        <span class="font-medium text-[var(--text-main)]">0.1.0</span>
      </div>
      <div v-if="instanceHost" class="flex justify-between items-center px-6 py-4 text-sm">
        <span class="text-[var(--text-subtle)]">伺服器</span>
        <a
          :href="`https://${instanceHost}`"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-[var(--accent)] hover:underline"
        >
          {{ instanceHost }}
        </a>
      </div>
      <div class="flex justify-between items-center px-6 py-4 text-sm">
        <span class="text-[var(--text-subtle)]">原始碼</span>
        <a
          href="https://github.com/glowrea/glowrea-client"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-[var(--accent)] hover:underline"
        >
          GitHub
        </a>
      </div>
    </section>
  </main>
</template>
