<script setup lang="ts">
import LocalTimeline from '~/components/timeline/LocalTimeline.vue'

// /:instance 參數目前僅用於 URL 語意，實際 API 固定指向 runtimeConfig.mastodonApiBase
const instance = useRoute().params.instance as string
useSeoMeta({ title: instance })
</script>

<template>
  <main>
    <LocalTimeline />
  </main>
</template>
