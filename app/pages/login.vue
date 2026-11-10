<script setup lang="ts">
const route = useRoute()

if (route.path === '/login') {
  await navigateTo('/instances', { replace: true })
}
</script>

<template>
  <NuxtPage />
</template>
