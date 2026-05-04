<script setup lang="ts">
import ImageLightbox from '~/components/status/ImageLightbox.vue'

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
  imageClass: 'h-45 w-full object-cover'
})

const imageAttachments = computed(() => {
  return (props.attachments || []).filter((media) => media.type === 'image' || !media.type)
})

const visibleImages = computed(() => imageAttachments.value.slice(0, props.maxVisible))
const hiddenCount = computed(() => Math.max(0, imageAttachments.value.length - props.maxVisible))
const maxCoverRatio = 20 / 9
const minCoverRatio = 9 / 20
const resolvedGridClass = computed(() => {
  const base = visibleImages.value.length === 1
    ? 'mt-4 grid grid-cols-1 gap-3'
    : props.gridClass
  return base.includes('items-') ? base : `${base} items-center`
})

const failedImageIds = ref<string[]>([])
const imageFitModes = ref<Record<string, 'cover' | 'full'>>({})
const imageOverflowDirs = ref<Record<string, 'horizontal' | 'vertical'>>({})
const baseImageClass = computed(() => {
  const cleaned = props.imageClass
    .replace(/\bobject-(cover|contain)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || 'h-45 w-full'
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

function resolveFitModeByRatio(ratio: number): { mode: 'cover' | 'full'; dir?: 'horizontal' | 'vertical' } {
  if (ratio > maxCoverRatio) return { mode: 'cover', dir: 'horizontal' }
  if (ratio < minCoverRatio) return { mode: 'cover', dir: 'vertical' }
  return { mode: 'full' }
}

function onImageLoad(id: string, media: StatusImageAttachment, event: Event): void {
  const element = event.target as HTMLImageElement | null
  if (!element?.naturalWidth || !element.naturalHeight) {
    imageFitModes.value[id] = 'cover'
    return
  }

  const previewRatio = element.naturalWidth / element.naturalHeight
  const previewFit = resolveFitModeByRatio(previewRatio)
  imageFitModes.value[id] = previewFit.mode
  if (previewFit.dir) {
    imageOverflowDirs.value[id] = previewFit.dir
  }

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
    const originalFit = resolveFitModeByRatio(originalRatio)
    imageFitModes.value[id] = originalFit.mode
    if (originalFit.dir) {
      imageOverflowDirs.value[id] = originalFit.dir
    }
    else {
      delete imageOverflowDirs.value[id]
    }
  }

  probe.src = media.url
}

function imageMaskStyle(id: string): Record<string, string> {
  const dir = imageOverflowDirs.value[id]
  if (!dir) return {}
  const fitMode = imageFitModes.value[id] || 'cover'
  if (fitMode === 'full') return {}

  const gradient = dir === 'horizontal'
    ? 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)'
    : 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)'

  return {
    maskImage: gradient,
    WebkitMaskImage: gradient,
  }
}

function imageDisplayClass(id: string): string {
  const fitMode = imageFitModes.value[id] || 'cover'
  if (fitMode === 'full') {
    return 'block w-auto max-w-full !h-auto'
  }

  return `${baseImageClass.value} object-cover`
}

function wrapperClass(id: string): string {
  const fitMode = imageFitModes.value[id] || 'cover'
  const base = 'relative overflow-hidden rounded-xl border border-stone-200 cursor-pointer'
  // full mode: shrink-wrap the image and center in cell
  if (fitMode === 'full') return `${base} w-fit mx-auto`
  // cover mode: fill the grid cell normally
  return base
}

function imageStyle(id: string): Record<string, string> {
  const dir = imageOverflowDirs.value[id]
  const fullMaxHeightPx = 450
  const fullMaxWidthPx = fullMaxHeightPx * maxCoverRatio
  const mask = imageMaskStyle(id)
  const fitMode = imageFitModes.value[id] || 'cover'
  if (fitMode === 'full' && dir === 'horizontal') return { ...mask, maxHeight: `${fullMaxHeightPx}px` }
  if (fitMode === 'full' && dir === 'vertical') return { ...mask, maxWidth: `${fullMaxWidthPx}px` }
  return mask
}

// ── 燈箱 ─────────────────────────────────────────────────────────
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const lightboxImages = computed(() =>
  imageAttachments.value.map(m => ({
    id: m.id,
    url: m.url,
    description: m.description,
  }))
)

function openLightbox(index: number): void {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

watch(imageAttachments, () => {
  failedImageIds.value = []
  imageFitModes.value = {}
  imageOverflowDirs.value = {}
})
</script>

<template>
  <div v-if="visibleImages.length" :class="resolvedGridClass">
    <div v-for="(media, index) in visibleImages" :key="media.id" :class="wrapperClass(media.id)"
      @click="openLightbox(index)">
      <img v-if="!isFailed(media.id)" :src="media.previewUrl || media.url" :alt="media.description || '貼文圖片'"
        :class="imageDisplayClass(media.id)" :style="imageStyle(media.id)" loading="lazy"
        @load="onImageLoad(media.id, media, $event)" @error="onImageError(media.id)">

      <div v-else class="flex h-45 items-center justify-center px-4 text-xs text-stone-500">
        圖片載入失敗
      </div>

      <span v-if="index === visibleImages.length - 1 && hiddenCount > 0"
        class="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
        +{{ hiddenCount }}
      </span>
    </div>
  </div>

  <ImageLightbox v-if="lightboxOpen" :images="lightboxImages" :initial-index="lightboxIndex"
    @close="lightboxOpen = false" />
</template>
