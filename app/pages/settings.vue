<script setup lang="ts">
useSeoMeta({ title: '設定' })

const { settings, setTheme } = useAppSettings()
const config = useRuntimeConfig()

const activeTab = ref<'appearance' | 'language' | 'about'>('appearance')

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟隨系統' },
]

const instanceHost = computed(() => {
  const base = config.public.mastodonApiBase
  if (!base) return null
  try {
    return new URL(base).hostname
  } catch {
    return base
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
    <section class="timeline-card rounded-2xl overflow-hidden">
      <!-- 標題 -->
      <div class="px-6 pt-6 pb-4 border-b border-[var(--surface-line)]">
        <h1 class="headline-font text-2xl font-semibold text-[var(--text-main)]">設定</h1>
      </div>

      <!-- Tab 列 -->
      <div class="border-b border-[var(--surface-line)] overflow-x-auto scrollbar-none">
        <nav class="flex min-w-max" role="tablist">
          <button
            v-for="tab in [
              { id: 'appearance', label: '外觀' },
              { id: 'language', label: '語言' },
              { id: 'about', label: '關於' },
            ]"
            :key="tab.id"
            class="home-tab"
            :class="activeTab === tab.id ? 'home-tab--active' : ''"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = (tab.id as typeof activeTab)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab 內容 -->
      <div class="px-6 py-6">
        <!-- 外觀 -->
        <template v-if="activeTab === 'appearance'">
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-[var(--text-main)] mb-3">色彩主題</p>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  class="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                  :class="
                    settings.theme === option.value
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'text-[var(--text-subtle)] border-[var(--surface-line)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  "
                  @click="setTheme(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- 語言 -->
        <template v-else-if="activeTab === 'language'">
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-[var(--text-main)] mb-3">介面語言</p>
              <button
                class="px-4 py-2 rounded-xl text-sm font-medium border bg-[var(--accent)] text-white border-[var(--accent)]"
                disabled
              >
                繁體中文
              </button>
              <p class="mt-2 text-xs text-[var(--text-subtle)]">v0 僅提供繁體中文，更多語言即將推出。</p>
            </div>
          </div>
        </template>

        <!-- 關於 -->
        <template v-else-if="activeTab === 'about'">
          <div class="space-y-4 text-sm text-[var(--text-main)]">
            <div class="flex justify-between items-center py-2 border-b border-[var(--surface-line)]">
              <span class="text-[var(--text-subtle)]">應用程式</span>
              <span class="font-medium">Glowrea</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-[var(--surface-line)]">
              <span class="text-[var(--text-subtle)]">版本</span>
              <span class="font-medium">0.1.0</span>
            </div>
            <div v-if="instanceHost" class="flex justify-between items-center py-2 border-b border-[var(--surface-line)]">
              <span class="text-[var(--text-subtle)]">伺服器</span>
              <a
                :href="`https://${instanceHost}`"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-[var(--accent)] hover:underline"
              >
                {{ instanceHost }}
              </a>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-[var(--text-subtle)]">原始碼</span>
              <a
                href="https://github.com/glowrea/glowrea-client"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-[var(--accent)] hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
