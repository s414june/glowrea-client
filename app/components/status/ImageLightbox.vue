<script setup lang="ts">
type LightboxImage = {
  id: string
  url: string
  description?: string | null
}

const props = defineProps<{
  images: LightboxImage[]
  initialIndex?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(props.initialIndex ?? 0)
const currentImage = computed(() => props.images[currentIndex.value])
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.images.length - 1)

function prev(): void {
  if (hasPrev.value) currentIndex.value--
}

function next(): void {
  if (hasNext.value) currentIndex.value++
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft') prev()
  else if (event.key === 'ArrowRight') next()
  else if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

watch(() => props.initialIndex, (val) => {
  if (val !== undefined) currentIndex.value = val
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex bg-black/90"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <!-- 關閉按鈕（左上 fixed） -->
      <button
        class="fixed left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
        aria-label="關閉"
        @click="emit('close')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 手機版：上下滿版圖片 + 下方可滾動 alt -->
      <div class="flex w-full flex-col md:hidden" @click.self="emit('close')">
        <div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden" @click.self="emit('close')">
          <!-- 左右切換按鈕 -->
          <button
            v-if="hasPrev"
            class="absolute left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="上一張"
            @click.stop="prev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            :key="currentImage?.id"
            :src="currentImage?.url"
            :alt="currentImage?.description || '貼文圖片'"
            class="max-h-full max-w-full object-contain"
          >

          <button
            v-if="hasNext"
            class="absolute right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="下一張"
            @click.stop="next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Alt 文字區（下方可滾動） -->
        <div
          v-if="currentImage?.description"
          class="max-h-36 shrink-0 overflow-y-auto border-t border-white/10 px-4 py-3"
        >
          <p class="text-sm leading-relaxed text-stone-300">{{ currentImage.description }}</p>
        </div>

        <!-- 多圖指示點 -->
        <div v-if="images.length > 1" class="flex shrink-0 justify-center gap-1.5 py-3">
          <button
            v-for="(img, i) in images"
            :key="img.id"
            class="h-1.5 rounded-full transition-all"
            :class="i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'"
            :aria-label="`切換至第 ${i + 1} 張`"
            @click.stop="currentIndex = i"
          />
        </div>
      </div>

      <!-- 電腦版：左邊圖片上下滿版 + 右邊 alt 欄 -->
      <div class="hidden w-full md:flex">
        <!-- 圖片區 -->
        <div class="relative flex min-w-0 flex-1 items-center justify-center" @click.self="emit('close')">
          <!-- 左右切換按鈕 -->
          <button
            v-if="hasPrev"
            class="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="上一張"
            @click.stop="prev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            :key="currentImage?.id"
            :src="currentImage?.url"
            :alt="currentImage?.description || '貼文圖片'"
            class="max-h-screen max-w-full object-contain"
          >

          <button
            v-if="hasNext"
            class="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="下一張"
            @click.stop="next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- 右側 alt 欄 -->
        <div
          v-if="currentImage?.description || images.length > 1"
          class="flex w-72 shrink-0 flex-col border-l border-white/10 bg-black/40"
        >
          <!-- Alt 文字 -->
          <div class="flex-1 overflow-y-auto px-5 py-6">
            <p
              v-if="currentImage?.description"
              class="text-sm leading-relaxed text-stone-300"
            >
              {{ currentImage.description }}
            </p>
            <p v-else class="text-sm italic text-stone-500">（無圖片描述）</p>
          </div>

          <!-- 多圖指示點 -->
          <div v-if="images.length > 1" class="flex justify-center gap-1.5 border-t border-white/10 py-4">
            <button
              v-for="(img, i) in images"
              :key="img.id"
              class="h-1.5 rounded-full transition-all"
              :class="i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'"
              :aria-label="`切換至第 ${i + 1} 張`"
              @click.stop="currentIndex = i"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
