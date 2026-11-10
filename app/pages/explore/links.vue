<script setup lang="ts">
import { useExplore } from '~/composables/useExplore'

const explore = useExplore()

function linkDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}
</script>

<template>
  <LoadingSkeleton v-if="explore.isTrendsLoading.value" />
  <template v-else>
    <div v-if="explore.trendingLinks.value.length" class="space-y-2">
      <a
        v-for="link in explore.trendingLinks.value"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="timeline-card rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-colors block"
      >
        <img v-if="link.image" :src="link.image" :alt="link.title" class="w-full h-36 object-cover" />
        <div class="p-4">
          <p class="font-semibold text-sm text-[var(--text-main)] line-clamp-2 leading-snug">{{ link.title }}</p>
          <p class="mt-1 text-xs text-[var(--text-subtle)]">
            {{ link.providerName || linkDomain(link.url) }}
            <span v-if="link.authorName"> · {{ link.authorName }}</span>
          </p>
        </div>
      </a>
    </div>
    <div v-else class="timeline-card rounded-2xl p-8 text-center">
      <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門連結</p>
    </div>
  </template>
</template>
