<script setup lang="ts">
import { ChevronUp } from 'lucide-vue-next'
import { useScrollBehavior } from '~/composables/useScrollBehavior'

const { showScrollTop, scrollToTop } = useScrollBehavior()
</script>

<template>
  <!--
    h-10 -mb-10: sticky 佔位 40px 高、負 margin 補回，不影響後續元素排版。
    sticky 貼在行動版底欄上方（bottom-[88px]）或桌機版底部（bottom-8）。
    flex justify-end 讓按鈕靠右對齊時間軸右緣。
  -->
  <div class="sticky bottom-[88px] z-30 h-10 -mb-10 flex justify-end lg:bottom-8 px-2">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <button
        v-if="showScrollTop"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-[#faf7f2]/95 text-stone-600 shadow-md backdrop-blur transition-colors hover:bg-stone-200 hover:text-stone-900"
        title="跳到最上"
        aria-label="跳到最上"
        @click="scrollToTop"
      >
        <ChevronUp class="h-5 w-5" aria-hidden="true" />
      </button>
    </Transition>
  </div>
</template>
