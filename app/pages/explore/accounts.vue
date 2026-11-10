<script setup lang="ts">
import { useExplore } from '~/composables/useExplore'
import { resolveCustomEmojiText } from '~/utils/emoji'

const explore = useExplore()
const { profilePath } = useAccountNavigation()
</script>

<template>
  <template v-if="explore.hasQuery.value">
    <LoadingSkeleton v-if="explore.isSearching.value" />
    <div v-else-if="explore.searchError.value" class="timeline-card rounded-2xl p-6 text-center">
      <p class="text-sm text-[var(--text-danger)]">{{ explore.searchError.value }}</p>
      <button class="mt-4 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]" @click="explore.search">重試</button>
    </div>
    <template v-else-if="explore.searchResults.value">
      <div v-if="explore.searchResults.value.accounts.length" class="space-y-2">
        <article v-for="account in explore.searchResults.value.accounts" :key="account.id" class="timeline-card rounded-2xl p-4 flex items-start gap-3">
          <NuxtLink :to="profilePath(account)" class="shrink-0" :aria-label="`${account.displayName || account.username} 的個人頁`">
            <img :src="account.avatar" :alt="`${account.displayName} 的頭像`" class="h-10 w-10 rounded-full object-cover" />
          </NuxtLink>
          <div class="min-w-0 flex-1">
            <NuxtLink :to="profilePath(account)" class="block truncate text-sm font-semibold text-[var(--text-main)] hover:underline"><span v-html="resolveCustomEmojiText(account.displayName || account.username, account.emojis ?? [])" /></NuxtLink>
            <NuxtLink :to="profilePath(account)" class="block truncate text-xs text-[var(--text-subtle)] hover:underline">@{{ account.acct }}</NuxtLink>
            <p v-if="account.note" class="mt-1 line-clamp-2 text-xs text-[var(--text-subtle)]" v-html="account.note" />
          </div>
        </article>
      </div>
      <div v-else class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">找不到相關帳號</p>
      </div>
    </template>
  </template>

  <template v-else>
    <LoadingSkeleton v-if="explore.isTrendsLoading.value" />
    <template v-else>
      <div v-if="explore.trendingAccounts.value.length" class="space-y-2">
        <article v-for="account in explore.trendingAccounts.value" :key="account.id" class="timeline-card rounded-2xl p-4 flex items-start gap-3 hover:border-[var(--accent)] transition-colors">
          <NuxtLink :to="profilePath(account)" class="shrink-0" :aria-label="`${account.displayName || account.username} 的個人頁`">
            <img :src="account.avatar" :alt="`${account.displayName} 的頭像`" class="h-10 w-10 rounded-full object-cover" />
          </NuxtLink>
          <div class="min-w-0 flex-1">
            <NuxtLink :to="profilePath(account)" class="block truncate text-sm font-semibold text-[var(--text-main)] hover:underline"><span v-html="resolveCustomEmojiText(account.displayName || account.username, account.emojis ?? [])" /></NuxtLink>
            <NuxtLink :to="profilePath(account)" class="block truncate text-xs text-[var(--text-subtle)] hover:underline">@{{ account.acct }}</NuxtLink>
            <p v-if="account.note" class="mt-1 line-clamp-2 text-xs text-[var(--text-subtle)]" v-html="account.note" />
          </div>
        </article>
      </div>
      <div v-else class="timeline-card rounded-2xl p-8 text-center">
        <p class="text-sm text-[var(--text-subtle)]">目前沒有熱門帳號</p>
      </div>
    </template>
  </template>
</template>
