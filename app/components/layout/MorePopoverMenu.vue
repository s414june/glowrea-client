<script setup lang="ts">
import {
  Bookmark,
  Hash,
  Heart,
  LogIn,
  LogOut,
  Settings,
  Users
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { useAuth } from '~/composables/useAuth'

const props = defineProps<{
  placement: 'sidebar' | 'mobile-top'
  triggerEl: HTMLElement | null
}>()

const route = useRoute()
const { isOpen, close } = useMoreMenu()
const { isAuthenticated, logout: authLogout } = useAuth()
const { hasInstance, localPath } = useInstanceConfig()

type MoreMenuLink = {
  type: 'link'
  key: string
  label: string
  icon: Component
  to: string
}

type MoreMenuAction = {
  type: 'action'
  key: string
  label: string
  icon: Component
  action: () => void | Promise<void>
}

async function logout(): Promise<void> {
  close()
  await authLogout()
  const dest = hasInstance.value && localPath.value ? localPath.value : '/timelines/federated'
  await navigateTo(dest)
}

const settingsItems: MoreMenuLink[] = [
  { type: 'link', key: 'settings', label: '設定', icon: Settings, to: '/settings' },
]

const mainItems = computed<MoreMenuLink[]>(() => [
  { type: 'link', key: 'likes', label: '喜歡', icon: Heart, to: '/likes' },
  { type: 'link', key: 'bookmarks', label: '書籤', icon: Bookmark, to: '/bookmarks' },
  { type: 'link', key: 'lists', label: '群組', icon: Users, to: '/lists' },
  { type: 'link', key: 'tags', label: '標籤', icon: Hash, to: '/tags' },
])

const dangerItems: MoreMenuAction[] = [
  { type: 'action', key: 'logout', label: '登出', icon: LogOut, action: logout },
]

// 未登入：只保留不需驗證的項目
const visibleMainItems = computed(() =>
  isAuthenticated.value ? mainItems.value : [],
)

const showDangerSection = computed(() => isAuthenticated.value)
const showLoginSection = computed(() => !isAuthenticated.value)

function isItemActive(item: MoreMenuLink): boolean {
  return route.path === item.to
}

// ── 點外側關閉 ────────────────────────────────────────────────────
const menuRef = ref<HTMLElement | null>(null)

function handleOutsideClick(e: MouseEvent): void {
  if (!menuRef.value) return
  // 若觸發按鈕被隱藏（parent display:none），此實例忽略事件
  if (props.triggerEl && props.triggerEl.offsetWidth === 0) return

  const target = e.target as Node
  if (menuRef.value.contains(target)) return
  if (props.triggerEl && props.triggerEl.contains(target)) return
  close()
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}

watch(isOpen, (val) => {
  if (!import.meta.client) return
  if (val) {
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('mousedown', handleOutsideClick)
    document.removeEventListener('keydown', handleKeydown)
  }
})

// 路由切換時自動關閉
watch(() => route.path, () => {
  if (isOpen.value) close()
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.removeEventListener('mousedown', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})

// ── 定位與動畫 ────────────────────────────────────────────────────
const positionClass = computed(() =>
  props.placement === 'sidebar' ? 'top-0 left-full ml-2' : 'top-full right-0 mt-1',
)

const transitionOrigin = computed(() =>
  props.placement === 'sidebar' ? 'origin-bottom-left' : 'origin-top-right',
)
</script>

<template>
  <Transition enter-from-class="opacity-0 scale-95"
    :enter-active-class="`transition duration-150 ease-out ${transitionOrigin}`" enter-to-class="opacity-100 scale-100"
    leave-from-class="opacity-100 scale-100" :leave-active-class="`transition duration-100 ease-in ${transitionOrigin}`"
    leave-to-class="opacity-0 scale-95">
    <div v-if="isOpen" ref="menuRef" :class="[
      'absolute z-50 w-52 rounded-2xl border border-[var(--surface-line)] nav-bg py-1 shadow-lg',
      positionClass,
    ]" role="menu" aria-label="更多選項">
      <!-- 設定，有分隔線 -->
      <div class="mb-1">
        <NuxtLink v-for="item in settingsItems" :key="item.key" :to="item.to"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors" :class="isItemActive(item)
            ? 'nav-active'
            : 'text-[var(--text-subtle)] hover:bg-[var(--surface-line)] hover:text-[var(--text-main)]'
            " role="menuitem" @click="close()">
          <component :is="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>

      <!-- 一般路由項目 -->
      <div v-show="visibleMainItems.length > 0" class="border-t border-[var(--surface-line)] py-1">
        <NuxtLink v-for="item in visibleMainItems" :key="item.key" :to="item.to"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors" :class="isItemActive(item)
            ? 'nav-active'
            : 'text-[var(--text-subtle)] hover:bg-[var(--surface-line)] hover:text-[var(--text-main)]'
            " role="menuitem" @click="close()">
          <component :is="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>

      <!-- 已登入：危險操作（登出） -->
      <div v-if="showDangerSection" class="pt-1 border-t border-[var(--surface-line)]">
        <button v-for="item in dangerItems" :key="item.key"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-[var(--surface-line)]"
          role="menuitem" @click="item.action()">
          <component :is="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </button>
      </div>

      <!-- 未登入：登入入口 -->
      <div v-if="showLoginSection" class="pt-1 border-t border-[var(--surface-line)]">
        <NuxtLink to="/login"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--nav-accent)] transition-colors hover:bg-[var(--surface-line)]"
          role="menuitem" @click="close()">
          <LogIn class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>登入</span>
        </NuxtLink>
      </div>
    </div>
  </Transition>
</template>
