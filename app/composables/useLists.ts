import type { ListItem } from '#shared/types/list'
import { fetchLists } from '~/utils/api/lists'

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error)
    return String((error as { statusMessage?: string }).statusMessage || 'Request failed.')
  if (error instanceof Error) return error.message
  return 'Request failed.'
}

export function useLists() {
  const items = ref<ListItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadLists(): Promise<void> {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null
    try {
      const res = await fetchLists()
      items.value = res.items
    } catch (e) {
      error.value = normalizeError(e)
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, error, loadLists }
}
