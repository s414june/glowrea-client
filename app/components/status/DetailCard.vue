<script setup lang="ts">
import type { StatusDetail } from '#shared/types/status'

const props = defineProps<{
  status: StatusDetail
}>()

const imageAttachments = computed(() => {
  return (props.status.mediaAttachments || []).filter((media) => media.type === 'image')
})

const visibleImages = computed(() => imageAttachments.value.slice(0, 4))
const hiddenCount = computed(() => Math.max(0, imageAttachments.value.length - 4))

const failedImageIds = ref<string[]>([])

function isFailed(id: string): boolean {
  return failedImageIds.value.includes(id)
}

function onImageError(id: string): void {
  if (failedImageIds.value.includes(id)) {
    return
  }

  failedImageIds.value = [...failedImageIds.value, id]
}
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
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p class="font-semibold text-stone-800">
            {{ status.account.displayName || status.account.username }}
          </p>
          <p class="text-sm text-stone-500">
            @{{ status.account.acct || status.account.username }}
          </p>
          <p class="text-sm text-stone-500">
            • {{ new Date(status.createdAt).toLocaleString('zh-TW') }}
          </p>
        </div>

        <div
          class="prose prose-stone mt-3 max-w-none text-sm"
          v-html="status.content"
        />

        <div
          v-if="visibleImages.length"
          class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div
            v-for="(media, index) in visibleImages"
            :key="media.id"
            class="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
          >
            <img
              v-if="!isFailed(media.id)"
              :src="media.previewUrl || media.url"
              :alt="media.description || '貼文圖片'"
              class="h-52 w-full object-cover"
              loading="lazy"
              @error="onImageError(media.id)"
            >

            <div
              v-else
              class="flex h-52 items-center justify-center px-4 text-xs text-stone-500"
            >
              圖片載入失敗
            </div>

            <span
              v-if="index === visibleImages.length - 1 && hiddenCount > 0"
              class="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
            >
              +{{ hiddenCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
