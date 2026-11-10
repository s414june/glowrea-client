<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import DetailCard from '~/components/status/DetailCard.vue'
import ContextList from '~/components/status/ContextList.vue'
import { useStatusDetail } from '~/composables/useStatusDetail'
import LoadingSkeleton from '~/components/timeline/LoadingSkeleton.vue'

const route = useRoute()
const router = useRouter()
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

const statusTitle = computed(() => {
  if (!status.value) return '貼文詳情'
  const s = status.value.reblog || status.value
  const name = s.account.displayName?.trim() || s.account.username
  return `${name} 的貼文`
})
useSeoMeta({ title: statusTitle })

const statusId = computed(() => {
  const raw = route.params.id
  if (typeof raw !== 'string') {
    return ''
  }

  return raw.trim()
})

const statusInstance = computed(() => typeof route.params.instance === 'string' ? route.params.instance : '')

function goBack(): void {
  if (typeof router.options.history.state.back === 'string') {
    router.back()
  } else {
    void navigateTo('/timelines')
  }
}

async function loadCurrentStatus(): Promise<void> {
  if (!statusId.value) {
    error.value = 'Invalid status id.'
    return
  }

  await load(statusId.value, statusInstance.value)
}

async function retryLoad(): Promise<void> {
  if (!statusId.value) {
    return
  }

  await retry(statusId.value, statusInstance.value)
}

async function refreshCurrentStatus(): Promise<void> {
  if (!statusId.value) {
    return
  }

  await refresh(statusId.value, statusInstance.value)
}

onMounted(async () => {
  await loadCurrentStatus()
})

watch([statusId, statusInstance], async ([value, instance], [previousValue, previousInstance]) => {
  if (!value || (value === previousValue && instance === previousInstance)) {
    return
  }

  await load(value, instance)
})
</script>

<template>
  <main class="mx-auto w-full max-w-2xl lg:mx-0 lg:ml-6 px-4 pb-6 sm:pb-10">
    <header class="flex items-center justify-between">
      <button
        class="rounded-xl p-2 text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-main)]"
        aria-label="返回"
        @click="goBack">
        <ArrowLeft class="h-5 w-5" aria-hidden="true" />
      </button>

      <span
        class="text-sm font-medium text-[var(--text-subtle)]">
        {{ isRefreshing ? 'Refreshing...' : '' }}
      </span>
    </header>

    <LoadingSkeleton v-if="isLoading && !status" />

    <div v-else-if="error && !status" class="timeline-card rounded-2xl p-6 text-center">
      <p class="text-sm text-[var(--text-danger)]">
        {{ error }}
      </p>
      <button
        class="mt-4 rounded-xl border border-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]"
        @click="retryLoad">
        Retry
      </button>
    </div>

    <div v-else-if="status">
      <DetailCard :status="status" />

      <p v-if="contextError"
        class="mt-4 rounded-xl border border-[var(--border-warning)] bg-[var(--surface-warning)] px-4 py-3 text-sm text-[var(--text-warning)]">
        {{ contextError }}
      </p>

      <ContextList v-if="context" :context="context" />
    </div>
  </main>
</template>
