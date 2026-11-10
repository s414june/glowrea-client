<script setup lang="ts">
useSeoMeta({ title: '切換社群' })

type InstanceOption = {
  domain: string
  description: string
  total_users?: number
  last_week_users?: number
  approval_required?: boolean
  categories?: string[]
  languages?: string[]
}

const { setHostname } = useInstanceConfig()
const configuredInstance = await $fetch<{ hostname: string | null }>('/api/config/instance')
const loginHistory = useCookie<string[] | null>('glowrea_login_instances')

const directoryInstances = ref<InstanceOption[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const searchQuery = ref('')
const customInstance = ref('')
const customError = ref<string | null>(null)
const isValidatingCustom = ref(false)
const currentPage = ref(1)
const approvalFilter = ref<'all' | 'required' | 'not-required'>('all')
const selectedCategories = ref<string[]>([])
const selectedLanguages = ref<string[]>([])
const categoryMenu = ref<HTMLDetailsElement | null>(null)
const languageMenu = ref<HTMLDetailsElement | null>(null)
const pageSize = 10
const isTaiwanBrowser = ref(false)
const chineseLocale = ref<'zh-TW' | 'zh-CN'>('zh-TW')

const categoryTranslations: Record<string, { 'zh-TW': string, 'zh-CN': string }> = {
  academia: { 'zh-TW': '學術', 'zh-CN': '学术' },
  activism: { 'zh-TW': '社會運動', 'zh-CN': '社会运动' },
  animals: { 'zh-TW': '動物', 'zh-CN': '动物' },
  art: { 'zh-TW': '藝術', 'zh-CN': '艺术' },
  bipoc: { 'zh-TW': '黑人、原住民族及有色人種', 'zh-CN': '黑人、原住民及有色人种' },
  books: { 'zh-TW': '書籍', 'zh-CN': '书籍' },
  business: { 'zh-TW': '商業', 'zh-CN': '商业' },
  cars: { 'zh-TW': '汽車', 'zh-CN': '汽车' },
  comics: { 'zh-TW': '漫畫', 'zh-CN': '漫画' },
  culture: { 'zh-TW': '文化', 'zh-CN': '文化' },
  cute: { 'zh-TW': '可愛', 'zh-CN': '可爱' },
  education: { 'zh-TW': '教育', 'zh-CN': '教育' },
  food: { 'zh-TW': '美食', 'zh-CN': '美食' },
  furry: { 'zh-TW': '獸迷', 'zh-CN': '兽迷' },
  games: { 'zh-TW': '遊戲', 'zh-CN': '游戏' },
  gaming: { 'zh-TW': '遊戲', 'zh-CN': '游戏' },
  general: { 'zh-TW': '綜合', 'zh-CN': '综合' },
  gender: { 'zh-TW': '性別', 'zh-CN': '性别' },
  health: { 'zh-TW': '健康', 'zh-CN': '健康' },
  hobby: { 'zh-TW': '興趣', 'zh-CN': '兴趣' },
  hobbies: { 'zh-TW': '興趣', 'zh-CN': '兴趣' },
  journalism: { 'zh-TW': '新聞', 'zh-CN': '新闻' },
  lgbtq: { 'zh-TW': 'LGBTQ+', 'zh-CN': 'LGBTQ+' },
  'lgbtq+': { 'zh-TW': 'LGBTQ+', 'zh-CN': 'LGBTQ+' },
  lgbt: { 'zh-TW': 'LGBTQ+', 'zh-CN': 'LGBTQ+' },
  meme: { 'zh-TW': '迷因', 'zh-CN': '梗图' },
  moderator: { 'zh-TW': '管理員', 'zh-CN': '管理员' },
  music: { 'zh-TW': '音樂', 'zh-CN': '音乐' },
  nature: { 'zh-TW': '自然', 'zh-CN': '自然' },
  news: { 'zh-TW': '新聞', 'zh-CN': '新闻' },
  nsfw: { 'zh-TW': '成人內容', 'zh-CN': '成人内容' },
  photography: { 'zh-TW': '攝影', 'zh-CN': '摄影' },
  politics: { 'zh-TW': '政治', 'zh-CN': '政治' },
  regional: { 'zh-TW': '地區', 'zh-CN': '地区' },
  religion: { 'zh-TW': '宗教', 'zh-CN': '宗教' },
  roleplay: { 'zh-TW': '角色扮演', 'zh-CN': '角色扮演' },
  science: { 'zh-TW': '科學', 'zh-CN': '科学' },
  sports: { 'zh-TW': '運動', 'zh-CN': '运动' },
  tech: { 'zh-TW': '科技', 'zh-CN': '科技' },
  technology: { 'zh-TW': '科技', 'zh-CN': '科技' },
}

onMounted(() => {
  const locales = [...(navigator.languages || []), navigator.language]
  const hasTaiwanLocale = locales.some((locale) => /(?:-|_)TW(?:$|-)/i.test(locale))
  const hasSimplifiedChineseLocale = locales.some((locale) => /^zh(?:-|_)(?:CN|SG|Hans)(?:$|-|_)/i.test(locale))
  const hasTaiwanTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Taipei'
  isTaiwanBrowser.value = hasTaiwanLocale || hasTaiwanTimezone
  chineseLocale.value = hasSimplifiedChineseLocale && !hasTaiwanLocale ? 'zh-CN' : 'zh-TW'
  document.addEventListener('pointerdown', closeMultiselectsOnOutsideClick)
  void loadDirectory()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeMultiselectsOnOutsideClick)
})

function closeMultiselectsOnOutsideClick(event: PointerEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return
  if (!categoryMenu.value?.contains(target) && categoryMenu.value) categoryMenu.value.open = false
  if (!languageMenu.value?.contains(target) && languageMenu.value) languageMenu.value.open = false
}

function localizeCategory(category: string): string {
  const normalized = category.trim().toLocaleLowerCase().replace(/[\s_-]+/g, '')
  return categoryTranslations[normalized]?.[chineseLocale.value] || category
}

function localizeLanguage(language: string): string {
  try {
    const code = language.trim().replaceAll('_', '-')
    return new Intl.DisplayNames([chineseLocale.value], { type: 'language' }).of(code) || language
  } catch {
    return language
  }
}

function getVerifyErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return '無法驗證這個社群。'

  const fetchError = error as {
    data?: unknown
    response?: { _data?: unknown }
    statusMessage?: unknown
    message?: unknown
  }
  for (const payload of [fetchError.data, fetchError.response?._data]) {
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
  }

  if (typeof fetchError.statusMessage === 'string' && fetchError.statusMessage.trim()) return fetchError.statusMessage
  if (typeof fetchError.message === 'string' && fetchError.message.trim()) return fetchError.message
  return '無法驗證這個社群。'
}

watch(searchQuery, (query) => {
  customInstance.value = query
}, { immediate: true })

async function loadDirectory(): Promise<void> {
  isLoading.value = true
  loadError.value = null
  try {
    directoryInstances.value = await $fetch<InstanceOption[]>('/api/instances')
  } catch {
    loadError.value = '目前無法載入其他社群，請稍後再試。'
  } finally {
    isLoading.value = false
  }
}

const previousLoginHosts = computed(() => {
  if (!Array.isArray(loginHistory.value)) return []
  return [...new Set(loginHistory.value
    .filter((host): host is string => typeof host === 'string')
    .map((host) => host.toLowerCase()))]
})

const featuredInstances = computed<InstanceOption[]>(() => {
  const hosts: string[] = []
  const g0vWasUsed = previousLoginHosts.value.includes('g0v.social')
  if (isTaiwanBrowser.value || g0vWasUsed) hosts.push('g0v.social')
  hosts.push(...previousLoginHosts.value)
  hosts.push('mastodon.social')

  const configuredHost = configuredInstance.hostname?.toLowerCase()
  if (configuredHost && (configuredHost !== 'g0v.social' || isTaiwanBrowser.value || g0vWasUsed)) {
    hosts.push(configuredHost)
  }

  const uniqueHosts = [...new Set(hosts)]
  return uniqueHosts.map((domain) => {
    const fromDirectory = directoryInstances.value.find((instance) => instance.domain === domain)
    const description = domain === 'g0v.social'
      ? '台灣公民科技社群'
      : domain === 'mastodon.social'
        ? 'Mastodon 社群'
        : fromDirectory?.description || (previousLoginHosts.value.includes(domain) ? '曾登入過的社群' : '目前設定的社群')
    return { ...fromDirectory, domain, description }
  })
})

const featuredHosts = computed(() => new Set(featuredInstances.value.map((instance) => instance.domain)))

const availableInstances = computed(() => {
  const entries = new Map(directoryInstances.value.map((instance) => [instance.domain, instance]))
  if (!entries.has('g0v.social')) {
    entries.set('g0v.social', { domain: 'g0v.social', description: '台灣公民科技社群' })
  }

  return [...entries.values()]
    .filter((instance) => !featuredHosts.value.has(instance.domain))
    .sort((a, b) => a.domain.localeCompare(b.domain, 'en', { sensitivity: 'base' }))
})

const availableCategories = computed(() => [...new Set(availableInstances.value.flatMap((instance) => instance.categories || []))].sort((a, b) => localizeCategory(a).localeCompare(localizeCategory(b), chineseLocale.value)))
const availableLanguages = computed(() => [...new Set(availableInstances.value.flatMap((instance) => instance.languages || []))].sort((a, b) => localizeLanguage(a).localeCompare(localizeLanguage(b), chineseLocale.value)))

const otherInstances = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return availableInstances.value
    .filter((instance) => !query || `${instance.domain} ${instance.description}`.toLocaleLowerCase().includes(query))
    .filter((instance) => approvalFilter.value === 'all'
      || (approvalFilter.value === 'required' ? instance.approval_required === true : instance.approval_required === false))
    .filter((instance) => !selectedCategories.value.length || instance.categories?.some((category) => selectedCategories.value.includes(category)))
    .filter((instance) => !selectedLanguages.value.length || instance.languages?.some((language) => selectedLanguages.value.includes(language)))
})

const totalPages = computed(() => Math.max(1, Math.ceil(otherInstances.value.length / pageSize)))
const pageNumberTabs = computed(() => [1, 2, 3].filter((page) => page <= totalPages.value))
const showLastPageTab = computed(() => totalPages.value > 3)
const visibleInstances = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return otherInstances.value.slice(start, start + pageSize)
})

watch([searchQuery, approvalFilter, selectedCategories, selectedLanguages], () => {
  currentPage.value = 1
}, { deep: true })

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

async function chooseCustomInstance(): Promise<void> {
  const input = customInstance.value.trim()
  if (!input || isValidatingCustom.value) return

  isValidatingCustom.value = true
  customError.value = null
  try {
    const instance = await $fetch<{ domain: string }>('/api/instances/verify', {
      method: 'POST',
      body: { instance: input },
    })
    setHostname(instance.domain)
    await navigateTo(`/login/${encodeURIComponent(instance.domain)}`)
  } catch (error: unknown) {
    customError.value = getVerifyErrorMessage(error)
  } finally {
    isValidatingCustom.value = false
  }
}

async function chooseInstance(hostname: string): Promise<void> {
  setHostname(hostname)
  await navigateTo(`/login/${encodeURIComponent(hostname)}`)
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-8 lg:mx-0 lg:ml-6">
    <section class="timeline-card rounded-3xl p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
        Glowrea Communities
      </p>
      <h1 class="headline-font mt-3 text-3xl font-semibold text-[var(--text-main)]">
        選擇你的社群
      </h1>

      <ul class="mt-6 space-y-3">
        <li v-for="instance in featuredInstances" :key="instance.domain">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--surface-line)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-bg)]"
            @click="chooseInstance(instance.domain)"
          >
            <span class="min-w-0">
              <span class="block truncate font-semibold text-[var(--text-main)]">{{ instance.domain }}</span>
              <span class="mt-1 block line-clamp-2 text-sm text-[var(--text-subtle)]">{{ instance.description }}</span>
            </span>
            <span class="shrink-0 text-sm font-medium text-[var(--accent)]">選擇 →</span>
          </button>
        </li>
      </ul>

      <div class="mt-8 border-t border-[var(--surface-line)] pt-6">
        <h2 class="text-xl font-semibold text-[var(--text-main)]">其他社群</h2>
        <p class="mt-1 text-sm text-[var(--text-subtle)]">
          Mastodon 官方收錄的社群，此目錄不涵蓋 聯邦宇宙 上的所有伺服器。
        </p>

        <div class="relative mt-4">
          <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋社群名稱或介紹"
            aria-label="搜尋社群"
            class="w-full rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-card)] py-3 pl-10 pr-10 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-main)]"
            aria-label="清除搜尋"
            @click="searchQuery = ''"
          >✕</button>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label class="text-xs text-[var(--text-subtle)]">
            手動審核
            <span class="relative mt-1 block">
              <select v-model="approvalFilter" class="w-full appearance-none rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] py-2.5 pl-3 pr-12 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <option value="all">全部</option>
                <option value="required">手動審核</option>
                <option value="not-required">立即註冊</option>
              </select>
              <svg class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>
          <div class="text-xs text-[var(--text-subtle)]">
            分類
            <details ref="categoryMenu" class="group relative mt-1">
              <summary class="flex cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] py-2.5 pl-3 pr-4 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <span>{{ selectedCategories.length ? `已選 ${selectedCategories.length} 項` : '所有分類' }}</span>
                <svg class="h-4 w-4 shrink-0 text-[var(--text-subtle)] transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </summary>
              <div class="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] p-2 shadow-lg">
                <button v-if="selectedCategories.length" type="button" class="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--accent)] hover:bg-[var(--surface-bg)]" @click="selectedCategories = []">清除選擇</button>
                <label v-for="category in availableCategories" :key="category" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--text-main)] hover:bg-[var(--surface-bg)]">
                  <input v-model="selectedCategories" type="checkbox" :value="category" class="accent-[var(--accent)]" />
                  <span>{{ localizeCategory(category) }}</span>
                </label>
              </div>
            </details>
          </div>
          <div class="text-xs text-[var(--text-subtle)]">
            語言
            <details ref="languageMenu" class="group relative mt-1">
              <summary class="flex cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] py-2.5 pl-3 pr-4 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <span>{{ selectedLanguages.length ? `已選 ${selectedLanguages.length} 項` : '所有語言' }}</span>
                <svg class="h-4 w-4 shrink-0 text-[var(--text-subtle)] transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </summary>
              <div class="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] p-2 shadow-lg">
                <button v-if="selectedLanguages.length" type="button" class="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--accent)] hover:bg-[var(--surface-bg)]" @click="selectedLanguages = []">清除選擇</button>
                <label v-for="language in availableLanguages" :key="language" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--text-main)] hover:bg-[var(--surface-bg)]">
                  <input v-model="selectedLanguages" type="checkbox" :value="language" class="accent-[var(--accent)]" />
                  <span>{{ localizeLanguage(language) }}</span>
                </label>
              </div>
            </details>
          </div>
        </div>

        <p v-if="isLoading" class="py-8 text-center text-sm text-[var(--text-subtle)]">正在載入社群清單…</p>
        <div v-else-if="loadError" class="py-8 text-center">
          <p class="text-sm text-[var(--text-subtle)]">{{ loadError }}</p>
          <button class="mt-3 text-sm font-medium text-[var(--accent)] hover:underline" @click="loadDirectory">
            重新載入
          </button>
        </div>
        <template v-else>
          <ul v-if="visibleInstances.length" class="mt-4 space-y-3">
            <li v-for="instance in visibleInstances" :key="instance.domain">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--surface-line)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-bg)]"
                @click="chooseInstance(instance.domain)"
              >
                <span class="min-w-0">
                  <span class="block truncate font-semibold text-[var(--text-main)]">{{ instance.domain }}</span>
                  <span v-if="instance.description" class="mt-1 block line-clamp-2 text-sm text-[var(--text-subtle)]">
                    {{ instance.description }}
                  </span>
                  <span v-else class="mt-1 block text-sm text-[var(--text-subtle)]">Mastodon 社群</span>
                  <span class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-subtle)]">
                    <span v-if="instance.total_users != null">總使用人數 {{ instance.total_users.toLocaleString() }}</span>
                    <span v-if="instance.last_week_users != null">本週人數 {{ instance.last_week_users.toLocaleString() }}</span>
                    <span v-if="instance.approval_required != null">{{ instance.approval_required ? '手動審核' : '立即註冊' }}</span>
                  </span>
                  <span v-if="instance.categories?.length" class="mt-2 flex flex-wrap gap-1.5">
                    <span v-for="category in instance.categories" :key="`category-${category}`" class="rounded-full bg-[var(--surface-bg)] px-2 py-0.5 text-xs text-[var(--text-subtle)]">#{{ localizeCategory(category) }}</span>
                  </span>
                  <span v-if="instance.languages?.length" class="mt-1 flex flex-wrap gap-1.5">
                    <span v-for="language in instance.languages" :key="`language-${language}`" class="rounded-full bg-[var(--surface-bg)] px-2 py-0.5 text-xs text-[var(--text-subtle)]">#{{ localizeLanguage(language) }}</span>
                  </span>
                </span>
                <span class="shrink-0 text-sm font-medium text-[var(--accent)]">選擇 →</span>
              </button>
            </li>
          </ul>
          <div v-else class="py-5 text-center">
            <p class="text-sm text-[var(--text-subtle)]">
              {{ searchQuery ? '找不到符合的社群。' : '目前沒有其他社群。' }}
            </p>

            <form class="mt-5 rounded-2xl border border-[var(--surface-line)] p-4 text-left" @submit.prevent="chooseCustomInstance">
              <h3 class="font-semibold text-[var(--text-main)]">自訂社群</h3>
              <p class="mt-1 text-sm text-[var(--text-subtle)]">內容會帶入上方搜尋文字；你可以在這裡修改，自訂社群輸入不會改動搜尋內容。</p>
              <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  v-model="customInstance"
                  type="text"
                  inputmode="url"
                  autocomplete="url"
                  placeholder="例如：example.social"
                  class="min-w-0 flex-1 rounded-xl border border-[var(--surface-line)] bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="submit"
                  class="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!customInstance.trim() || isValidatingCustom"
                >
                  {{ isValidatingCustom ? '驗證中…' : '選擇社群' }}
                </button>
              </div>
              <p v-if="customError" class="mt-3 text-sm text-[var(--text-danger)]">{{ customError }}</p>
            </form>
          </div>

          <nav v-if="totalPages > 1" class="mt-5 flex flex-nowrap items-center justify-start gap-1 overflow-x-auto whitespace-nowrap px-0.5 sm:justify-center sm:gap-2" aria-label="社群清單分頁">
            <button
              type="button"
              class="shrink-0 rounded-lg border border-[var(--surface-line)] px-2 py-2 text-sm text-[var(--text-main)] disabled:opacity-40 sm:px-3"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >上一頁</button>
            <button
              v-for="page in pageNumberTabs"
              :key="page"
              type="button"
              class="min-w-9 shrink-0 rounded-lg border px-2 py-2 text-sm sm:px-3"
              :class="currentPage === page ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--surface-line)] text-[var(--text-main)] hover:bg-[var(--surface-bg)]'"
              :aria-current="currentPage === page ? 'page' : undefined"
              @click="currentPage = page"
            >{{ page }}</button>
            <span v-if="showLastPageTab" class="shrink-0 px-1 text-sm text-[var(--text-subtle)]" aria-hidden="true">…</span>
            <button
              v-if="showLastPageTab"
              type="button"
              class="min-w-9 shrink-0 rounded-lg border px-3 py-2 text-sm"
              :class="currentPage === totalPages ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--surface-line)] text-[var(--text-main)] hover:bg-[var(--surface-bg)]'"
              :aria-current="currentPage === totalPages ? 'page' : undefined"
              @click="currentPage = totalPages"
            >{{ totalPages }}</button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-[var(--surface-line)] px-2 py-2 text-sm text-[var(--text-main)] disabled:opacity-40 sm:px-3"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >下一頁</button>
          </nav>
          <p v-if="otherInstances.length" class="mt-3 text-center text-xs text-[var(--text-subtle)]">
            第 {{ currentPage }} / {{ totalPages }} 頁，每頁 10 個社群
          </p>
        </template>
      </div>
    </section>
  </main>
</template>
