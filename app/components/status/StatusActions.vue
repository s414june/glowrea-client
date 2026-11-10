<script setup lang="ts">
import { Bookmark, Copy, Flag, Heart, MessageCircle, MoreHorizontal, Repeat2, Share2, Users, X } from 'lucide-vue-next'
import type { StatusActionResult, StatusActor, StatusDetail } from '#shared/types/status'
import type { TimelineStatus } from '#shared/types/timeline'
import { resolveCustomEmojiText } from '~/utils/emoji'

const props = defineProps<{
  status: TimelineStatus | StatusDetail
}>()

const route = useRoute()
const auth = useAuth()
const { hostname, ensureHostname } = useInstanceConfig()
const { profilePath } = useAccountNavigation()

const menuRoot = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const isBusy = ref(false)
const isFavourited = ref(false)
const isReblogged = ref(false)
const isBookmarked = ref(false)
const favouritesCount = ref(0)
const reblogsCount = ref(0)
const repliesCount = ref(0)
const actionError = ref<string | null>(null)
const notice = ref<string | null>(null)
const actorsType = ref<'favourited' | 'reblogged' | null>(null)
const actors = ref<StatusActor[]>([])
const actorsLoading = ref(false)
const actorsError = ref<string | null>(null)
const reportOpen = ref(false)
const reportCategory = ref<'spam' | 'violation' | 'illegal' | 'other'>('other')
const reportComment = ref('')
const reportError = ref<string | null>(null)
const reportSent = ref(false)

const statusId = computed(() => props.status.id)
const statusAccountId = computed(() => props.status.account.id)
const statusUrl = computed(() => props.status.url || '')
const routeInstance = computed(() => typeof route.params.instance === 'string' ? route.params.instance : '')
const statusInstance = computed(() => {
  if (routeInstance.value) return routeInstance.value
  if (auth.serverOrigin.value) {
    try { return new URL(auth.serverOrigin.value).hostname } catch { /* use configured instance below */ }
  }
  return hostname.value || ''
})

function statusCount(kind: 'favourites' | 'reblogs' | 'replies'): number {
  const status = props.status
  if ('createdAt' in status) {
    return kind === 'favourites' ? status.favouritesCount || 0
      : kind === 'reblogs' ? status.reblogsCount || 0
        : status.repliesCount || 0
  }
  return kind === 'favourites' ? status.favourites_count || 0
    : kind === 'reblogs' ? status.reblogs_count || 0
      : status.replies_count || 0
}

function syncFromStatus(): void {
  isFavourited.value = Boolean(props.status.favourited)
  isReblogged.value = Boolean(props.status.reblogged)
  isBookmarked.value = Boolean(props.status.bookmarked)
  favouritesCount.value = statusCount('favourites')
  reblogsCount.value = statusCount('reblogs')
  repliesCount.value = statusCount('replies')
}

watch(() => props.status.id, syncFromStatus, { immediate: true })

function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String((error as { statusMessage?: string }).statusMessage || '操作失敗。')
  }
  return error instanceof Error ? error.message : '操作失敗。'
}

function actionQuery(): { instance?: string } | undefined {
  return routeInstance.value ? { instance: routeInstance.value } : undefined
}

async function requireLogin(): Promise<boolean> {
  if (await auth.ensureSession()) {
    if (routeInstance.value && auth.serverOrigin.value) {
      try {
        if (new URL(auth.serverOrigin.value).hostname !== routeInstance.value) {
          actionError.value = `請先登入 ${routeInstance.value} 再操作這篇貼文。`
          return false
        }
      } catch { /* session endpoint validates the server origin */ }
    }
    return true
  }

  if (!routeInstance.value) await ensureHostname()
  const instance = routeInstance.value || hostname.value
  await navigateTo(instance ? `/login/${encodeURIComponent(instance)}` : '/login')
  return false
}

async function runStatusAction(action: string): Promise<StatusActionResult> {
  return await $fetch<StatusActionResult>(`/api/statuses/${encodeURIComponent(statusId.value)}/${action}`, {
    method: 'POST',
    query: actionQuery(),
  })
}

async function toggleFavourite(): Promise<void> {
  if (isBusy.value || !(await requireLogin())) return
  const wasFavourited = isFavourited.value
  isBusy.value = true
  actionError.value = null
  notice.value = null
  try {
    const result = await runStatusAction(wasFavourited ? 'unfavourite' : 'favourite')
    isFavourited.value = result.favourited ?? !wasFavourited
    favouritesCount.value = result.favouritesCount ?? Math.max(0, favouritesCount.value + (wasFavourited ? -1 : 1))
  } catch (error) {
    actionError.value = normalizeError(error)
  } finally {
    isBusy.value = false
  }
}

async function toggleReblog(): Promise<void> {
  if (isBusy.value || !(await requireLogin())) return
  const wasReblogged = isReblogged.value
  isBusy.value = true
  actionError.value = null
  notice.value = null
  try {
    const result = await runStatusAction(wasReblogged ? 'unreblog' : 'reblog')
    isReblogged.value = result.reblogged ?? !wasReblogged
    reblogsCount.value = result.reblogsCount ?? Math.max(0, reblogsCount.value + (wasReblogged ? -1 : 1))
  } catch (error) {
    actionError.value = normalizeError(error)
  } finally {
    isBusy.value = false
  }
}

async function toggleBookmark(): Promise<void> {
  if (isBusy.value || !(await requireLogin())) return
  const wasBookmarked = isBookmarked.value
  menuOpen.value = false
  isBusy.value = true
  actionError.value = null
  notice.value = null
  try {
    const result = await runStatusAction(wasBookmarked ? 'unbookmark' : 'bookmark')
    isBookmarked.value = result.bookmarked ?? !wasBookmarked
    notice.value = isBookmarked.value ? '已加入書籤' : '已移除書籤'
  } catch (error) {
    actionError.value = normalizeError(error)
  } finally {
    isBusy.value = false
  }
}

function postLink(): string {
  if (statusUrl.value) return statusUrl.value
  if (import.meta.client) {
    const account = props.status.account.acct || props.status.account.username
    const handle = account.startsWith('@') ? account : `@${account}`
    const encodedAccount = encodeURIComponent(handle).replace(/%40/gi, '@')
    const instance = statusInstance.value
    if (instance) return new URL(`/${encodeURIComponent(instance)}/${encodedAccount}/${encodeURIComponent(statusId.value)}`, window.location.origin).toString()
    return window.location.href
  }
  return ''
}

async function copyPostLink(): Promise<void> {
  menuOpen.value = false
  const link = postLink()
  if (!link) return
  try {
    await navigator.clipboard.writeText(link)
  } catch {
    const input = document.createElement('textarea')
    input.value = link
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    if (!copied) {
      actionError.value = '無法複製貼文連結。'
      return
    }
  }
  notice.value = '已複製貼文連結'
}

async function sharePost(): Promise<void> {
  const link = postLink()
  if (!link) return
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: '分享貼文', url: link })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      actionError.value = normalizeError(error)
    }
  } else {
    await copyPostLink()
  }
}

async function showActors(type: 'favourited' | 'reblogged'): Promise<void> {
  actorsType.value = type
  actors.value = []
  actorsError.value = null
  actorsLoading.value = true
  try {
    if (!statusInstance.value) await ensureHostname()
    actors.value = await $fetch<StatusActor[]>(`/api/statuses/${encodeURIComponent(statusId.value)}/actors`, {
      query: { type, ...(statusInstance.value ? { instance: statusInstance.value } : {}) },
    })
  } catch (error) {
    actorsError.value = normalizeError(error)
  } finally {
    actorsLoading.value = false
  }
}

function openReport(): void {
  menuOpen.value = false
  reportCategory.value = 'other'
  reportComment.value = ''
  reportError.value = null
  reportSent.value = false
  reportOpen.value = true
}

async function submitReport(): Promise<void> {
  if (isBusy.value || !(await requireLogin())) return
  isBusy.value = true
  reportError.value = null
  try {
    await $fetch(`/api/statuses/${encodeURIComponent(statusId.value)}/report`, {
      method: 'POST',
      query: actionQuery(),
      body: { accountId: statusAccountId.value, category: reportCategory.value, comment: reportComment.value },
    })
    reportSent.value = true
  } catch (error) {
    reportError.value = normalizeError(error)
  } finally {
    isBusy.value = false
  }
}

function closeDialogs(): void {
  actorsType.value = null
  reportOpen.value = false
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (menuRoot.value && !menuRoot.value.contains(event.target as Node)) menuOpen.value = false
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div class="mt-2" @click.stop @keydown.stop>
    <div class="grid grid-cols-4 items-center text-[var(--text-subtle)]">
      <div class="flex items-center justify-center gap-0.5">
        <button
          type="button"
          class="flex h-9 items-center justify-center rounded-lg px-2 transition-colors hover:bg-[var(--surface-hover)]"
          :class="isFavourited ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'"
          :disabled="isBusy"
          :aria-label="isFavourited ? '取消按讚' : '按讚'"
          :title="isFavourited ? '取消按讚' : '按讚'"
          @click.stop="toggleFavourite"
        >
          <Heart class="h-4 w-4" :fill="isFavourited ? 'currentColor' : 'none'" aria-hidden="true" />
          <span class="sr-only">{{ isFavourited ? '已按讚' : '按讚' }}</span>
        </button>
        <button
          type="button"
          class="min-w-6 rounded-lg px-1 py-2 text-xs transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
          :aria-label="`查看喜歡這則貼文的人，目前 ${favouritesCount} 人`"
          title="查看喜歡的人"
          @click.stop="showActors('favourited')"
        >{{ favouritesCount || '' }}</button>
      </div>

      <button type="button" class="flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-xs transition-colors hover:bg-[var(--surface-hover)]" disabled aria-disabled="true" title="留言功能尚未開放">
        <MessageCircle class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">留言（尚未開放）</span>
        <span v-if="repliesCount">{{ repliesCount }}</span>
      </button>

      <div class="flex items-center justify-center gap-0.5">
        <button
          type="button"
          class="flex h-9 items-center justify-center rounded-lg px-2 transition-colors hover:bg-[var(--surface-hover)]"
          :class="isReblogged ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'"
          :disabled="isBusy"
          :aria-label="isReblogged ? '取消轉嘟' : '轉嘟'"
          :title="isReblogged ? '取消轉嘟' : '轉嘟'"
          @click.stop="toggleReblog"
        >
          <Repeat2 class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">{{ isReblogged ? '已轉嘟' : '轉嘟' }}</span>
        </button>
        <button
          type="button"
          class="min-w-6 rounded-lg px-1 py-2 text-xs transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
          :aria-label="`查看轉嘟這則貼文的人，目前 ${reblogsCount} 人`"
          title="查看轉嘟的人"
          @click.stop="showActors('reblogged')"
        >{{ reblogsCount || '' }}</button>
      </div>

      <button type="button" class="flex h-9 items-center justify-center rounded-lg px-2 transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]" aria-label="分享" title="分享" @click.stop="sharePost">
        <Share2 class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <div ref="menuRoot" class="absolute right-2 top-2 z-10">
      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]" aria-label="更多貼文操作" title="更多" :aria-expanded="menuOpen" @click.stop="menuOpen = !menuOpen">
        <MoreHorizontal class="h-5 w-5" aria-hidden="true" />
      </button>
      <div v-if="menuOpen" class="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--surface-line)] nav-bg py-1 shadow-lg">
        <button type="button" class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--text-main)] hover:bg-[var(--surface-hover)]" :disabled="isBusy" @click.stop="toggleBookmark">
          <Bookmark class="h-4 w-4" :fill="isBookmarked ? 'currentColor' : 'none'" aria-hidden="true" />
          <span>{{ isBookmarked ? '移除書籤' : '加入書籤' }}</span>
        </button>
        <button type="button" class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--text-main)] hover:bg-[var(--surface-hover)]" @click.stop="copyPostLink">
          <Copy class="h-4 w-4" aria-hidden="true" />
          <span>複製連結</span>
        </button>
        <button type="button" class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--text-danger)] hover:bg-[var(--surface-hover)]" @click.stop="openReport">
          <Flag class="h-4 w-4" aria-hidden="true" />
          <span>檢舉</span>
        </button>
      </div>
    </div>

    <p v-if="actionError" class="mt-2 text-xs text-[var(--text-danger)]" role="alert">{{ actionError }}</p>
    <p v-else-if="notice" class="mt-2 text-xs text-[var(--text-subtle)]" role="status">{{ notice }}</p>

    <div v-if="actorsType" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" @click.self="closeDialogs">
      <section class="timeline-card max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl" role="dialog" aria-modal="true" :aria-label="actorsType === 'favourited' ? '喜歡的人' : '轉嘟的人'">
        <header class="flex items-center justify-between border-b border-[var(--surface-line)] px-4 py-3">
          <h2 class="font-semibold text-[var(--text-main)]">{{ actorsType === 'favourited' ? '喜歡的人' : '轉嘟的人' }}</h2>
          <button type="button" class="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--surface-hover)]" aria-label="關閉" @click="closeDialogs"><X class="h-4 w-4" /></button>
        </header>
        <div class="max-h-[65vh] overflow-y-auto p-2">
          <p v-if="actorsLoading" class="p-6 text-center text-sm text-[var(--text-subtle)]">載入中…</p>
          <p v-else-if="actorsError" class="p-6 text-center text-sm text-[var(--text-danger)]">{{ actorsError }}</p>
          <p v-else-if="actors.length === 0" class="p-6 text-center text-sm text-[var(--text-subtle)]">目前沒有顯示的人選</p>
          <NuxtLink v-for="actor in actors" :key="actor.id" :to="profilePath(actor)" class="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-hover)]" @click="closeDialogs">
            <img :src="actor.avatar" :alt="actor.displayName || actor.username" class="h-10 w-10 rounded-full object-cover">
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-[var(--text-main)]" v-html="resolveCustomEmojiText(actor.displayName || actor.username, actor.emojis ?? [])" />
              <span class="block truncate text-xs text-[var(--text-subtle)]">@{{ actor.acct }}</span>
            </span>
            <Users class="ml-auto h-4 w-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </div>

    <div v-if="reportOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" @click.self="closeDialogs">
      <section class="timeline-card w-full max-w-md rounded-2xl p-5" role="dialog" aria-modal="true" aria-labelledby="status-report-title">
        <div class="mb-4 flex items-center justify-between">
          <h2 id="status-report-title" class="font-semibold text-[var(--text-main)]">檢舉貼文</h2>
          <button type="button" class="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--surface-hover)]" aria-label="關閉" @click="closeDialogs"><X class="h-4 w-4" /></button>
        </div>
        <template v-if="reportSent">
          <p class="text-sm text-[var(--text-subtle)]">檢舉已送出，感謝協助維護社群。</p>
          <button type="button" class="mt-5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]" @click="closeDialogs">完成</button>
        </template>
        <template v-else>
          <label class="mb-2 block text-sm text-[var(--text-subtle)]" for="status-report-category">檢舉原因</label>
          <select id="status-report-category" v-model="reportCategory" class="mb-4 w-full rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-main)]">
            <option value="spam">垃圾訊息</option>
            <option value="violation">違反社群規範</option>
            <option value="illegal">違法內容</option>
            <option value="other">其他</option>
          </select>
          <label class="mb-2 block text-sm text-[var(--text-subtle)]" for="status-report-comment">補充說明（選填）</label>
          <textarea id="status-report-comment" v-model="reportComment" rows="3" maxlength="1000" class="w-full resize-y rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-main)]" />
          <p v-if="reportError" class="mt-2 text-sm text-[var(--text-danger)]" role="alert">{{ reportError }}</p>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-xl px-4 py-2 text-sm text-[var(--text-subtle)] hover:bg-[var(--surface-hover)]" @click="closeDialogs">取消</button>
            <button type="button" class="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50" :disabled="isBusy" @click="submitReport">{{ isBusy ? '送出中…' : '送出檢舉' }}</button>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>
