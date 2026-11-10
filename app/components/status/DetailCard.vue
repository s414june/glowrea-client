<script setup lang="ts">
import type { StatusDetail } from '#shared/types/status'
import StatusImageGallery from '~/components/status/StatusImageGallery.vue'

const props = defineProps<{
  status: StatusDetail
}>()
</script>

<template>
  <article class="timeline-card rounded-2xl p-5 sm:p-6">
    <div class="flex items-start gap-3">
      <img
        :src="status.account.avatar"
        :alt="status.account.displayName || status.account.username"
        class="h-10 w-10 rounded-full border border-[var(--surface-line)] object-cover"
      >

      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p class="min-w-0 truncate font-semibold text-[var(--text-main)]">
            {{ status.account.displayName || status.account.username }}
          </p>
          <p class="min-w-0 truncate text-sm text-[var(--text-subtle)]">
            @{{ status.account.acct || status.account.username }}
          </p>
          <p class="shrink-0 text-sm text-[var(--text-subtle)]">
            • {{ new Date(status.createdAt).toLocaleString('zh-TW') }}
          </p>
        </div>

        <div
          class="mastodon-content mt-3 max-w-none break-words text-sm"
          v-html="status.content"
        />

        <StatusImageGallery :attachments="status.mediaAttachments || []" />
      </div>
    </div>
  </article>
</template>
