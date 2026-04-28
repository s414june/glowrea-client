<script setup lang="ts">
import GlowreaLogo from '~/components/layout/GlowreaLogo.vue'
import { useAppNavigation } from '~/composables/useAppNavigation'
import { useHomeRefreshSignal } from '~/composables/useHomeRefreshSignal'
import { useProfileRefreshSignal } from '~/composables/useProfileRefreshSignal'
import { navigationIcons } from '~/components/layout/navigationIcons'
import MorePopoverMenu from '~/components/layout/MorePopoverMenu.vue'
import type { NavItem } from '~/composables/useAppNavigation'

const route = useRoute()
const { desktopItems } = useAppNavigation()
const { triggerHomeRefresh } = useHomeRefreshSignal()
const { triggerProfileRefresh } = useProfileRefreshSignal()
const { isOpen: moreMenuOpen, toggle: toggleMoreMenu } = useMoreMenu()

const regularDesktopItems = computed(() => desktopItems.filter(i => i.key !== 'more'))
const moreButtonRef = ref<HTMLElement | null>(null)

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function goHomeAndRefreshTimeline(): Promise<void> {
  triggerHomeRefresh()
  await navigateTo('/home')
}

function handleNavClick(item: NavItem): void {
  if (item.key === 'profile') {
    triggerProfileRefresh()
  }
}
</script>

<template>
  <aside class="h-screen border-r border-stone-200 bg-[#faf7f2] px-4 py-6">
    <button
      class="headline-font mb-6 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-lg font-semibold text-[var(--nav-accent)] transition-colors hover:bg-stone-100"
      title="回到首頁並刷新"
      aria-label="回到首頁並刷新"
      @click="goHomeAndRefreshTimeline"
    >
      <GlowreaLogo class="h-12 w-12" />
      Glowrea
    </button>

    <nav class="space-y-2">
      <NuxtLink
        v-for="item in regularDesktopItems"
        :key="item.key"
        :to="item.to"
        :title="item.label"
        :aria-label="item.label"
        class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
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
        <span>{{ item.label }}</span>
      </NuxtLink>

      <!-- 更多：彈窗觸發器 -->
      <div class="relative">
        <button
          ref="moreButtonRef"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          :class="moreMenuOpen ? 'nav-active' : 'text-stone-700 hover:bg-stone-200 hover:text-stone-900'"
          :aria-expanded="moreMenuOpen"
          aria-haspopup="menu"
          title="更多"
          aria-label="更多"
          @click="toggleMoreMenu"
        >
          <component
            :is="navigationIcons.more"
            class="h-5 w-5"
            aria-hidden="true"
          />
          <span>更多</span>
        </button>
        <MorePopoverMenu placement="sidebar" :trigger-el="moreButtonRef" />
      </div>
    </nav>
  </aside>
</template>
