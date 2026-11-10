<script setup lang="ts">
import type { StatusDetail } from '#shared/types/status'
import StatusImageGallery from '~/components/status/StatusImageGallery.vue'
import StatusActions from '~/components/status/StatusActions.vue'
import { resolveCustomEmoji, resolveCustomEmojiText } from '~/utils/emoji'

const props = defineProps<{
  status: StatusDetail
}>()
const { profilePath } = useAccountNavigation()
</script>

<template>
  <article class="timeline-card relative rounded-2xl p-5 sm:p-6">
    <div class="flex items-start gap-3">
      <NuxtLink :to="profilePath(status.account)" class="shrink-0" :aria-label="`${status.account.displayName || status.account.username} 的個人頁`">
        <img
          :src="status.account.avatar"
          :alt="status.account.displayName || status.account.username"
          class="h-10 w-10 rounded-full border border-[var(--surface-line)] object-cover"
        >
      </NuxtLink>

      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <NuxtLink :to="profilePath(status.account)" class="min-w-0 truncate font-semibold text-[var(--text-main)] hover:underline">
            <span v-html="resolveCustomEmojiText(status.account.displayName || status.account.username, status.account.emojis ?? [])" />
          </NuxtLink>
          <NuxtLink :to="profilePath(status.account)" class="min-w-0 truncate text-sm text-[var(--text-subtle)] hover:underline">
            @{{ status.account.acct || status.account.username }}
          </NuxtLink>
          <p class="shrink-0 text-sm text-[var(--text-subtle)]">
            • {{ new Date(status.createdAt).toLocaleString('zh-TW') }}
          </p>
        </div>

        <div
          class="mastodon-content mt-3 max-w-none break-words text-sm"
          v-html="resolveCustomEmoji(status.content, status.emojis ?? [])"
        />

        <StatusImageGallery :attachments="status.mediaAttachments || []" />
      </div>
    </div>
    <StatusActions :status="status.reblog || status" />
  </article>
</template>
