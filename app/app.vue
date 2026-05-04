<script setup lang="ts">
const { initSettings } = useAppSettings()
onMounted(() => initSettings())
</script>

<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ include: ['TimelinesPage'] }" />
    </NuxtLayout>
  </div>
</template>
