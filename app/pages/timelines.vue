<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const auth = useAuth()
const route = useRoute()
const { hostname, hasInstance, localPath, federatedPath } = useInstanceConfig()

// 確保 instance hostname 已載入（SSR + client 皆執行，不依賴 useAsyncData 快取）
const headers = useRequestHeaders(['cookie'])
const data = await $fetch<{ hostname: string | null }>('/api/config/instance', { headers })
hostname.value = data.hostname
</script>

<template>
  <!--
    頁籤列（追蹤、私人、社群）
    登入後顯示完整頁籤；未登入僅顯示社群。
    不 sticky，隨頁面自由滑動。
  -->
  <div class="border-b border-stone-200">
    <div class="mx-auto w-full max-w-2xl overflow-x-auto scrollbar-none">
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

  <NuxtPage />
</template>