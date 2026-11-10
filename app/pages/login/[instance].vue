<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const auth = useAuth()
const { hostname: selectedHostname, ensureHostname, setHostname } = useInstanceConfig()
const instance = String(route.params.instance || '').toLowerCase()
const serverHost = computed(() => instance.replace(/^https?:\/\//, '').replace(/\/$/, ''))

await ensureHostname()
const configuredInstance = await $fetch<{ hostname: string | null }>('/api/config/instance')
const supportedHosts = new Set([
  'g0v.social',
  'mastodon.social',
  configuredInstance.hostname?.toLowerCase(),
  selectedHostname.value?.toLowerCase(),
])
if (!supportedHosts.has(instance)) {
  await navigateTo('/instances', { replace: true })
} else {
  setHostname(instance)
}

useSeoMeta({ title: '登入' })

async function handleLogin(): Promise<void> {
  await auth.login(instance)
}
</script>

<template>
  <main class="mx-auto flex max-w-3xl items-center px-4 pt-8 lg:mx-0 lg:ml-6">
    <section class="timeline-card w-full rounded-3xl p-8 sm:p-12">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
        Glowrea Access
      </p>
      <h1 class="headline-font mt-3 text-3xl font-semibold text-[var(--text-main)] sm:text-4xl">
        登入 Glowrea
      </h1>
      <p class="mt-4 max-w-xl text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
        連線至
        <span class="font-medium text-[var(--text-main)]">{{ serverHost }}</span>社群。
      </p>

      <div class="mt-8 flex flex-wrap items-center gap-3">
        <button
          class="rounded-xl border border-teal-700 bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          :disabled="auth.isLoading.value"
          @click="handleLogin"
        >
          {{ auth.isLoading.value ? '跳轉中...' : `前往 ${serverHost} 授權登入` }}
        </button>
        <NuxtLink
          to="/instances"
          class="rounded-xl border border-[var(--surface-line)] px-5 py-3 text-sm font-semibold text-[var(--text-main)] transition-colors hover:bg-[var(--surface-line)]"
        >
          切換社群
        </NuxtLink>
      </div>

      <p
        v-if="auth.errorMessage.value"
        class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ auth.errorMessage.value }}
      </p>
    </section>
  </main>
</template>
