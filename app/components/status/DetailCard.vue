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
        class="h-10 w-10 rounded-full border border-stone-200 object-cover"
      >

      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p class="min-w-0 truncate font-semibold text-stone-800">
            {{ status.account.displayName || status.account.username }}
          </p>
          <p class="min-w-0 truncate text-sm text-stone-500">
            @{{ status.account.acct || status.account.username }}
          </p>
          <p class="shrink-0 text-sm text-stone-500">
            • {{ new Date(status.createdAt).toLocaleString('zh-TW') }}
          </p>
        </div>

        <div
          class="prose prose-stone mt-3 max-w-none break-words text-sm"
          v-html="status.content"
        />

        <StatusImageGallery :attachments="status.mediaAttachments || []" />
      </div>
    </div>
  </article>
</template>
