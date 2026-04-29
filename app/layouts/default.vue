<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import GlowreaLogo from '~/components/layout/GlowreaLogo.vue'
import MorePopoverMenu from '~/components/layout/MorePopoverMenu.vue'
import { useAppNavigation } from '~/composables/useAppNavigation'
import { useHomeRefreshSignal } from '~/composables/useHomeRefreshSignal'
import { useProfileRefreshSignal } from '~/composables/useProfileRefreshSignal'
import { useAuth } from '~/composables/useAuth'
import { useScrollBehavior } from '~/composables/useScrollBehavior'
import { navigationIcons } from '~/components/layout/navigationIcons'
import type { NavItem } from '~/composables/useAppNavigation'

const route = useRoute()
const { mobileTopItems, mobileBottomItems } = useAppNavigation()
const { triggerHomeRefresh } = useHomeRefreshSignal()
const { triggerProfileRefresh } = useProfileRefreshSignal()
const { isOpen: moreMenuOpen, toggle: toggleMoreMenu } = useMoreMenu()
const { isAuthenticated } = useAuth()

const regularMobileTopItems = computed(() => mobileTopItems.value.filter(i => i.key !== 'more'))

const mobileBottomGridClass = computed(() =>
  mobileBottomItems.value.length <= 3 ? 'grid-cols-3' : 'grid-cols-5',
)
const mobileMoreButtonRef = ref<HTMLElement | null>(null)

function handleNavClick(item: NavItem): void {
  if (item.key === 'profile') {
    triggerProfileRefresh()
  }
}

const { headerVisible } = useScrollBehavior()

const isLoginPage = computed(() => route.path === '/login')

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function goHomeAndRefreshTimeline(): Promise<void> {
  triggerHomeRefresh()
  await navigateTo('/timelines')
}
</script>

<template>
  <div v-if="isLoginPage" class="app-shell">
    <slot />
  </div>

  <div v-else class="app-shell min-h-screen">
    <div class="hidden xl:block xl:fixed xl:left-0 xl:top-0 xl:z-30 xl:h-screen xl:w-[260px]">
      <AppSidebar />
    </div>

    <div class="min-h-screen">
      <!-- 手機版 header：fixed + 滾動方向動畫 -->
      <header
        class="fixed inset-x-0 top-0 z-20 border-b border-stone-200 bg-[#faf7f2]/95 px-4 py-3 backdrop-blur transition-transform duration-300 ease-in-out xl:hidden"
        :class="headerVisible ? 'translate-y-0' : '-translate-y-full'"
      >
        <div class="mx-auto flex w-full max-w-2xl items-center justify-between">
          <button
            class="headline-font flex items-center gap-2 rounded-xl px-3 text-md font-semibold text-[var(--nav-accent)]"
            title="回到首頁並刷新"
            aria-label="回到首頁並刷新"
            @click="goHomeAndRefreshTimeline"
          >
            <GlowreaLogo class="h-10 w-10" />
            <span>Glowrea</span>
          </button>

          <div class="flex items-center gap-2">
            <NuxtLink
              v-for="item in regularMobileTopItems"
              :key="item.key"
              :to="item.to"
              :title="item.label"
              :aria-label="item.label"
              class="rounded-xl p-2 transition-colors"
              :class="isActive(item.to)
                ? 'nav-active'
                : 'text-stone-700 hover:text-stone-900'"
              @click="handleNavClick(item)"
            >
              <component
                :is="navigationIcons[item.icon]"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span class="sr-only">{{ item.label }}</span>
            </NuxtLink>

            <!-- 更多：彈窗觸發器 -->
            <div class="relative">
              <button
                ref="mobileMoreButtonRef"
                class="rounded-xl p-2 transition-colors"
                :class="moreMenuOpen ? 'nav-active' : 'text-stone-700 hover:text-stone-900'"
                :aria-expanded="moreMenuOpen"
                aria-haspopup="menu"
                title="更多"
                aria-label="更多"
                @click="toggleMoreMenu"
              >
                <component
                  :is="navigationIcons.more"
                  class="h-4 w-4"
                  aria-hidden="true"
                />
                <span class="sr-only">更多</span>
              </button>
              <MorePopoverMenu placement="mobile-top" :trigger-el="mobileMoreButtonRef" />
            </div>
          </div>
        </div>
      </header>

      <!-- 補足 fixed header 推走的空間（僅手機） -->
      <div class="h-16 xl:hidden" />

      <div class="pb-20 xl:pb-0">
        <slot />
      </div>

      <!-- 桌機版發文 FAB（僅登入後顯示） -->
      <NuxtLink
        v-if="isAuthenticated"
        to="/compose"
        title="發文"
        aria-label="發文"
        class="fixed bottom-8 right-8 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-stone-200 text-stone-700 shadow-sm transition-colors hover:bg-stone-300 hover:shadow-md xl:flex border border-stone-300"
      >
        <component
          :is="navigationIcons.compose"
          class="h-6 w-6"
          aria-hidden="true"
        />
      </NuxtLink>

      <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-[#faf7f2]/95 px-3 py-2 backdrop-blur xl:hidden">
        <div :class="['mx-auto grid w-full max-w-2xl gap-2', mobileBottomGridClass]">
          <template v-for="item in mobileBottomItems" :key="item.key">
            <!-- 發文：特殊圓形 accent 按鈕 -->
            <NuxtLink
              v-if="item.key === 'compose'"
              :to="item.to"
              :title="item.label"
              :aria-label="item.label"
              class="flex items-center justify-center"
            >
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-700 shadow-sm transition-colors hover:bg-stone-300">
                <component
                  :is="navigationIcons[item.icon]"
                  class="h-5 w-5"
                  aria-hidden="true"
                />
              </span>
              <span class="sr-only">{{ item.label }}</span>
            </NuxtLink>

            <!-- 一般導覽項目 -->
            <NuxtLink
              v-else
              :to="item.to"
              :title="item.label"
              :aria-label="item.label"
              class="flex items-center justify-center rounded-xl px-2 py-2 transition-colors"
              :class="isActive(item.to)
                ? 'nav-active'
                : 'text-stone-700 hover:bg-stone-200 hover:text-stone-900'"
              @click="handleNavClick(item)"
            >
              <component
                :is="navigationIcons[item.icon]"
                class="h-5 w-5"
                aria-hidden="true"
              />
              <span class="sr-only">{{ item.label }}</span>
            </NuxtLink>
          </template>
        </div>
      </nav>
    </div>
  </div>
</template>
