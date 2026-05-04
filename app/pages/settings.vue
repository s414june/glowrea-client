<script setup lang="ts">
const route = useRoute()
const headerVisible = useState<boolean>('header-visible', () => true)
</script>

<template>
  <div
    class="fixed inset-x-0 top-0 z-[19] border-b border-stone-200 bg-[#faf7f2]/95 backdrop-blur transition-transform duration-300 ease-in-out xl:sticky xl:inset-x-auto xl:translate-y-0 xl:z-10"
    :class="headerVisible ? 'translate-y-16' : '-translate-y-full'"
  >
    <div class="mx-auto w-full max-w-2xl overflow-x-auto scrollbar-none">
      <nav class="flex min-w-max" role="tablist" aria-label="設定頁籤">
        <NuxtLink
          to="/settings"
          class="home-tab"
          :class="route.path === '/settings' ? 'home-tab--active' : ''"
          role="tab"
        >外觀</NuxtLink>
        <NuxtLink
          to="/settings/language"
          class="home-tab"
          :class="route.path === '/settings/language' ? 'home-tab--active' : ''"
          role="tab"
        >語言</NuxtLink>
        <NuxtLink
          to="/settings/about"
          class="home-tab"
          :class="route.path === '/settings/about' ? 'home-tab--active' : ''"
          role="tab"
        >關於</NuxtLink>
      </nav>
    </div>
  </div>

  <!-- 補足 fixed tab nav 推走的空間（僅手機） -->
  <div class="h-12 xl:hidden" />

  <NuxtPage />
</template>
