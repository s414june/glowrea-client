<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import DetailCard from '~/components/status/DetailCard.vue'
import ContextList from '~/components/status/ContextList.vue'
import { useStatusDetail } from '~/composables/useStatusDetail'
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'

const route = useRoute()
const {
  status,
  context,
  isLoading,
  isRefreshing,
  error,
  contextError,
  load,
  refresh,
  retry
} = useStatusDetail()

const statusId = computed(() => {
  const raw = route.params.id
  if (typeof raw !== 'string') {
    return ''
  }

  return raw.trim()
})

async function loadCurrentStatus(): Promise<void> {
  if (!statusId.value) {
    error.value = 'Invalid status id.'
    return
  }

  await load(statusId.value)
}

async function retryLoad(): Promise<void> {
  if (!statusId.value) {
    return
  }

  await retry(statusId.value)
}

async function refreshCurrentStatus(): Promise<void> {
  if (!statusId.value) {
    return
  }

  await refresh(statusId.value)
}

onMounted(async () => {
  await loadCurrentStatus()
})

watch(statusId, async (value, previousValue) => {
  if (!value || value === previousValue) {
    return
  }

  await load(value)
})
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
    <header class="mb-5 flex items-center justify-between">
      <button
        class="rounded-xl p-2 text-stone-700 transition-colors hover:bg-stone-200"
        aria-label="返回"
        @click="navigateTo('/home')">
        <ArrowLeft class="h-5 w-5" aria-hidden="true" />
      </button>

      <span
        class="text-sm font-medium text-stone-400">
        {{ isRefreshing ? 'Refreshing...' : '' }}
      </span>
    </header>

    <LoadingSkeleton v-if="isLoading && !status" />

    <div v-else-if="error && !status" class="timeline-card rounded-2xl p-6 text-center">
      <p class="text-sm text-rose-700">
        {{ error }}
      </p>
      <button
        class="mt-4 rounded-xl border border-rose-600 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
        @click="retryLoad">
        Retry
      </button>
    </div>

    <div v-else-if="status">
      <DetailCard :status="status" />

      <p v-if="contextError"
        class="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {{ contextError }}
      </p>

      <ContextList v-if="context" :context="context" />
    </div>
  </main>
</template>
