<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'TimelinesPage' })

const headerVisible = useState<boolean>('header-visible', () => true)

const auth = useAuth()
const route = useRoute()
const { hostname, hasInstance, localPath, federatedPath, ensureHostname, setHostname } = useInstanceConfig()

await ensureHostname()
if (auth.isAuthenticated.value && auth.serverOrigin.value) {
  setHostname(new URL(auth.serverOrigin.value).hostname)
} else if (typeof route.params.instance === 'string') {
  setHostname(route.params.instance)
}
</script>

<template>
  <!--
    頁籤列（追蹤、私人、社群）
    登入後顯示完整頁籤；未登入僅顯示社群。
    不 sticky，隨頁面自由滑動。
  -->
  <div
    class="fixed inset-x-0 top-0 z-[19] border-b border-[var(--surface-line)] nav-bg-blur backdrop-blur transition-transform duration-300 ease-in-out lg:sticky lg:inset-x-auto lg:translate-y-0 lg:z-10"
    :class="headerVisible ? 'translate-y-16' : '-translate-y-full'"
  >
    <div class="mx-auto w-full max-w-2xl lg:mx-0 lg:ml-6 overflow-x-auto scrollbar-none">
      <nav class="flex min-w-max" role="tablist" aria-label="首頁頁籤">
        <template v-if="auth.isAuthenticated.value">
          <NuxtLink to="/timelines" class="home-tab" :class="route.path === '/timelines' ? 'home-tab--active' : ''"
            role="tab">追蹤</NuxtLink>
          <NuxtLink to="/timelines/messages" class="home-tab"
            :class="route.path === '/timelines/messages' ? 'home-tab--active' : ''" role="tab">私人</NuxtLink>
        </template>
        <NuxtLink v-if="hasInstance" :to="localPath!" class="home-tab"
          :class="route.path.endsWith('/local') ? 'home-tab--active' : ''" role="tab">社群</NuxtLink>
      </nav>
    </div>
  </div>

  <NuxtPage :keepalive="true" />
</template>
