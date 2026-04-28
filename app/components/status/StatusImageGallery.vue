<script setup lang="ts">
type StatusImageAttachment = {
  id: string
  type?: string
  url: string
  previewUrl?: string
  description?: string | null
}

const props = withDefaults(defineProps<{
  attachments: StatusImageAttachment[]
  maxVisible?: number
  gridClass?: string
  imageClass?: string
}>(), {
  maxVisible: 4,
  gridClass: 'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2',
  imageClass: 'h-52 w-full object-cover'
})

const imageAttachments = computed(() => {
  return (props.attachments || []).filter((media) => media.type === 'image' || !media.type)
})

const visibleImages = computed(() => imageAttachments.value.slice(0, props.maxVisible))
const hiddenCount = computed(() => Math.max(0, imageAttachments.value.length - props.maxVisible))
const maxCoverRatio = 16 / 9
const minCoverRatio = 9 / 16
const resolvedGridClass = computed(() => {
  if (visibleImages.value.length === 1) {
    return 'mt-4 grid grid-cols-1 gap-3'
  }

  return props.gridClass
})

const failedImageIds = ref<string[]>([])
const imageFitModes = ref<Record<string, 'cover' | 'full'>>({})
const baseImageClass = computed(() => {
  const cleaned = props.imageClass
    .replace(/\bobject-(cover|contain)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || 'h-52 w-full'
})

function isFailed(id: string): boolean {
  return failedImageIds.value.includes(id)
}

function onImageError(id: string): void {
  if (failedImageIds.value.includes(id)) {
    return
  }

  failedImageIds.value = [...failedImageIds.value, id]
}

function resolveFitModeByRatio(ratio: number): 'cover' | 'full' {
  if (ratio > maxCoverRatio || ratio < minCoverRatio) {
    return 'cover'
  }

  return 'full'
}

function onImageLoad(id: string, media: StatusImageAttachment, event: Event): void {
  const element = event.target as HTMLImageElement | null
  if (!element?.naturalWidth || !element.naturalHeight) {
    imageFitModes.value[id] = 'cover'
    return
  }

  const previewRatio = element.naturalWidth / element.naturalHeight
  imageFitModes.value[id] = resolveFitModeByRatio(previewRatio)

  // Preview URL may be cropped by upstream. Probe original URL to get final fit mode.
  if (!media.url || media.url === media.previewUrl) {
    return
  }

  const probe = new Image()
  probe.onload = () => {
    if (!probe.naturalWidth || !probe.naturalHeight) {
      return
    }

    const originalRatio = probe.naturalWidth / probe.naturalHeight
    imageFitModes.value[id] = resolveFitModeByRatio(originalRatio)
  }

  probe.src = media.url
}

function imageDisplayClass(id: string): string {
  const fitMode = imageFitModes.value[id] || 'cover'
  if (fitMode === 'full') {
    return `${baseImageClass.value} !h-auto object-contain`
  }

  return `${baseImageClass.value} object-cover`
}

watch(imageAttachments, () => {
  failedImageIds.value = []
  imageFitModes.value = {}
})
</script>

<template>
  <div v-if="visibleImages.length" :class="resolvedGridClass">
    <div
      v-for="(media, index) in visibleImages"
      :key="media.id"
      class="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
    >
      <img
        v-if="!isFailed(media.id)"
        :src="media.previewUrl || media.url"
        :alt="media.description || '貼文圖片'"
        :class="imageDisplayClass(media.id)"
        loading="lazy"
        @load="onImageLoad(media.id, media, $event)"
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
</template>
