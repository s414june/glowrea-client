<script setup lang="ts">
const auth = useAuth()
await auth.ensureSession()

if (auth.isAuthenticated.value) {
  await navigateTo('/timelines', { replace: true })
} else {
  const instance = useInstanceConfig()
  await instance.ensureHostname()
  await navigateTo(instance.loginPath.value, { replace: true })
}
</script>

<template>
  <div />
</template>
