<script setup lang="ts">
import { Flower2 } from 'lucide-vue-next'
import AppSidebar from '~/components/layout/AppSidebar.vue'
import { useAppNavigation } from '~/composables/useAppNavigation'
import { useHomeRefreshSignal } from '~/composables/useHomeRefreshSignal'
import { navigationIcons } from '~/components/layout/navigationIcons'

const route = useRoute()
const { mobileTopItems, mobileBottomItems } = useAppNavigation()
const { triggerHomeRefresh } = useHomeRefreshSignal()

const isLoginPage = computed(() => route.path === '/login')

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function goHomeAndRefreshTimeline(): Promise<void> {
  triggerHomeRefresh()
  await navigateTo('/home')
}
</script>

<template>
  <div v-if="isLoginPage" class="app-shell">
    <slot />
  </div>

  <div v-else class="app-shell min-h-screen">
    <div class="hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen lg:w-[260px]">
      <AppSidebar />
    </div>

    <div class="min-h-screen">
      <header class="sticky top-0 z-20 border-b border-stone-200 bg-[#faf7f2]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div class="mx-auto flex w-full max-w-2xl items-center justify-between">
          <button
            class="headline-font flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800"
            title="回到首頁並刷新"
            aria-label="回到首頁並刷新"
            @click="goHomeAndRefreshTimeline"
          >
            <Flower2 class="h-4 w-4" aria-hidden="true" />
            <span>Glowrea</span>
          </button>

          <div class="flex items-center gap-2">
            <NuxtLink
              v-for="item in mobileTopItems"
              :key="item.key"
              :to="item.to"
              :title="item.label"
              :aria-label="item.label"
              class="rounded-xl p-2 transition-colors"
              :class="isActive(item.to)
                ? 'bg-teal-600 text-white'
                : 'bg-stone-200 text-stone-700'"
            >
              <component
                :is="navigationIcons[item.icon]"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span class="sr-only">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </header>

      <div class="pb-20 lg:pb-0">
        <slot />
      </div>

      <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-[#faf7f2]/95 px-3 py-2 backdrop-blur lg:hidden">
        <div class="mx-auto grid w-full max-w-2xl grid-cols-4 gap-2">
          <NuxtLink
            v-for="item in mobileBottomItems"
            :key="item.key"
            :to="item.to"
            :title="item.label"
            :aria-label="item.label"
            class="flex items-center justify-center rounded-xl px-2 py-2 transition-colors"
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
        </div>
      </nav>
    </div>
  </div>
</template>
