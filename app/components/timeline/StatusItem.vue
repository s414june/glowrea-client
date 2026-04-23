<script setup lang="ts">
import type { TimelineStatus } from '#shared/types/timeline'

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
  return (activeStatus.value.media_attachments || []).filter((media) => media.type === 'image')
})

const primaryImage = computed(() => imageAttachments.value[0] || null)
const extraImageCount = computed(() => Math.max(0, imageAttachments.value.length - 1))

const hasImageError = ref(false)

function onImageError(): void {
  hasImageError.value = true
}

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

        <div v-if="primaryImage" class="mt-3">
          <div
            v-if="hasImageError"
            class="rounded-xl border border-stone-200 bg-stone-100 px-4 py-8 text-center text-xs text-stone-500"
          >
            圖片載入失敗
          </div>

          <div v-else class="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            <img
              :src="primaryImage.preview_url || primaryImage.url"
              :alt="primaryImage.description || `${authorName} 的貼文圖片`"
              class="h-44 w-full object-cover"
              loading="lazy"
              @error="onImageError"
            >

            <span
              v-if="extraImageCount > 0"
              class="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
            >
              +{{ extraImageCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>