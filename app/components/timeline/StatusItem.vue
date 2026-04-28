<script setup lang="ts">
import type { TimelineStatus } from '#shared/types/timeline'
import StatusImageGallery from '~/components/status/StatusImageGallery.vue'

const props = defineProps<{
  status: TimelineStatus
}>()

const activeStatus = computed(() => props.status.reblog || props.status)

const authorName = computed(() => {
  const name = activeStatus.value.account.display_name?.trim()
  return name || activeStatus.value.account.username
})

const authorHandle = computed(() => `@${activeStatus.value.account.acct || activeStatus.value.account.username}`)

const boostedBy = computed(() => {
  if (!props.status.reblog) {
    return null
  }

  return `@${props.status.account.acct || props.status.account.username}`
})

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(new Date(activeStatus.value.created_at))
})

const imageAttachments = computed(() => {
  return (activeStatus.value.media_attachments || []).map((media) => ({
    id: media.id,
    type: media.type,
    url: media.url,
    previewUrl: media.preview_url,
    description: media.description || `${authorName.value} 的貼文圖片`
  }))
})

const router = useRouter()

function shouldSkipCardNavigation(event: MouseEvent | KeyboardEvent): boolean {
  if (!(event.target instanceof Element)) {
    return false
  }

  return Boolean(event.target.closest('a'))
}

function openDetail(event: MouseEvent | KeyboardEvent): Promise<void> {
  if (shouldSkipCardNavigation(event)) {
    event.stopPropagation()
    return Promise.resolve()
  }

  return router.push(`/status/${activeStatus.value.id}`).then(() => { })
}
</script>

<template>
  <article class="timeline-card cursor-pointer rounded-2xl p-4 transition-transform duration-200" role="button"
    tabindex="0" @click="openDetail($event)" @keydown.enter.prevent="openDetail($event)" @keydown.space.prevent="openDetail($event)">
    <p v-if="boostedBy" class="mb-2 text-xs font-medium text-teal-700">
      Boosted by {{ boostedBy }}
    </p>

    <div class="flex items-start gap-3">
      <img :src="activeStatus.account.avatar" :alt="authorName"
        class="h-10 w-10 rounded-full border border-stone-200 object-cover">

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p class="font-semibold text-stone-800">
            {{ authorName }}
          </p>
          <p class="text-sm text-stone-500">
            {{ authorHandle }}
          </p>
          <p class="text-sm text-stone-500">
            • {{ formattedTime }}
          </p>
        </div>

        <div class="prose prose-stone mt-2 max-w-none text-sm" v-html="activeStatus.content" />

        <StatusImageGallery
          :attachments="imageAttachments"
        />
      </div>
    </div>
  </article>
</template>