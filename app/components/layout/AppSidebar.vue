<script setup lang="ts">
import { Flower2 } from 'lucide-vue-next'
import { useAppNavigation } from '~/composables/useAppNavigation'
import { useHomeRefreshSignal } from '~/composables/useHomeRefreshSignal'
import { navigationIcons } from '~/components/layout/navigationIcons'

const route = useRoute()
const { desktopItems } = useAppNavigation()
const { triggerHomeRefresh } = useHomeRefreshSignal()

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function goHomeAndRefreshTimeline(): Promise<void> {
  triggerHomeRefresh()
  await navigateTo('/home')
}
</script>

<template>
  <aside class="sticky top-0 h-screen border-r border-stone-200 bg-[#faf7f2] px-4 py-6">
    <button
      class="headline-font mb-6 flex w-full items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-lg font-semibold text-stone-800 transition-colors hover:bg-stone-100"
      title="回到首頁並刷新"
      aria-label="回到首頁並刷新"
      @click="goHomeAndRefreshTimeline"
    >
      <Flower2 class="h-5 w-5" />
      Glowrea
    </button>

    <nav class="space-y-2">
      <NuxtLink
        v-for="item in desktopItems"
        :key="item.key"
        :to="item.to"
        :title="item.label"
        :aria-label="item.label"
        class="flex items-center justify-center rounded-xl px-3 py-3 text-sm font-medium transition-colors"
        :class="isActive(item.to)
          ? 'bg-teal-600 text-white'
          : 'text-stone-700 hover:bg-stone-200'"
      >
        <component
          :is="navigationIcons[item.icon]"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <span class="sr-only">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
