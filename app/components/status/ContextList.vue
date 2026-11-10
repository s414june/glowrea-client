<script setup lang="ts">
import type { StatusContext } from '#shared/types/status'
import { resolveCustomEmoji, resolveCustomEmojiText } from '~/utils/emoji'
import StatusActions from '~/components/status/StatusActions.vue'

defineProps<{
  context: StatusContext
}>()
const { profilePath } = useAccountNavigation()
</script>

<template>
  <section class="mt-4 space-y-4">
    <div
      v-if="context.ancestors.length"
      class="timeline-card rounded-2xl p-4"
    >
      <h3 class="mb-3 text-sm font-semibold text-[var(--text-main)]">
        上文
      </h3>
      <ul class="space-y-3">
        <li
          v-for="item in context.ancestors"
          :key="item.id"
          class="relative rounded-xl border border-[var(--surface-line)] bg-[var(--surface-bg)] p-3"
        >
          <NuxtLink :to="profilePath(item.account)" class="text-xs text-[var(--text-subtle)] hover:underline">
            <span v-html="resolveCustomEmojiText(item.account.displayName || item.account.username, item.account.emojis ?? [])" />
          </NuxtLink>
          <div
            class="mastodon-content mt-1 max-w-none text-sm"
            v-html="resolveCustomEmoji(item.content, item.emojis ?? [])"
          />
          <StatusActions :status="item" />
        </li>
      </ul>
    </div>

    <div
      v-if="context.descendants.length"
      class="timeline-card rounded-2xl p-4"
    >
      <h3 class="mb-3 text-sm font-semibold text-[var(--text-main)]">
        回覆
      </h3>
      <ul class="space-y-3">
        <li
          v-for="item in context.descendants"
          :key="item.id"
          class="relative rounded-xl border border-[var(--surface-line)] bg-[var(--surface-bg)] p-3"
        >
          <NuxtLink :to="profilePath(item.account)" class="text-xs text-[var(--text-subtle)] hover:underline">
            <span v-html="resolveCustomEmojiText(item.account.displayName || item.account.username, item.account.emojis ?? [])" />
          </NuxtLink>
          <div
            class="mastodon-content mt-1 max-w-none text-sm"
            v-html="resolveCustomEmoji(item.content, item.emojis ?? [])"
          />
          <StatusActions :status="item" />
        </li>
      </ul>
    </div>
  </section>
</template>
