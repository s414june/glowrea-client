<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

useSeoMeta({ title: '登入' })

const auth = useAuth()
const config = useRuntimeConfig()

const serverHost = computed(() => {
  try {
    return new URL(config.public.mastodonApiBase).hostname
  } catch {
    return config.public.mastodonApiBase || ''
  }
})

async function handleLogin(): Promise<void> {
  await auth.login()
}
</script>

<template>
  <main class="mx-auto flex max-w-3xl items-center pt-8 px-4 lg:mx-0 lg:ml-6">
    <section class="timeline-card w-full rounded-3xl p-8 sm:p-12">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
        Glowrea Access
      </p>
      <h1 class="headline-font mt-3 text-3xl font-semibold text-[var(--text-main)] sm:text-4xl">
        登入 Glowrea
      </h1>
      <p class="mt-4 max-w-xl text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
        連線至
        <span class="font-medium text-[var(--text-main)]">{{ serverHost }}</span>。登入後即可檢視
        Home Timeline，登出時會清除本地 session。
      </p>

      <div class="mt-8">
        <button
          class="rounded-xl border border-teal-700 bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          :disabled="auth.isLoading.value" @click="handleLogin">
          {{ auth.isLoading.value ? '跳轉中...' : `前往 ${serverHost} 授權登入` }}
        </button>
      </div>

      <p v-if="auth.errorMessage.value"
        class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ auth.errorMessage.value }}
      </p>
    </section>
  </main>
</template>
