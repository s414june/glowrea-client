<script setup lang="ts">
const auth = useAuth()
await auth.ensureSession()

if (auth.isAuthenticated.value) {
  await navigateTo('/home', { replace: true })
} else {
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div />
</template>