<script setup lang="ts">
// 重導向至新的巢狀路由
const instance = useRoute().params.instance as string
await navigateTo(`/timelines/${instance}/local`, { replace: true })
</script>

<template>
  <div />
</template>
