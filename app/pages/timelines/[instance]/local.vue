<script setup lang="ts">
import LocalTimeline from '~/components/timeline/LocalTimeline.vue'

const instance = useRoute().params.instance as string
useSeoMeta({ title: `本站 · ${instance}` })
</script>

<template>
  <LocalTimeline />
</template>
