<script setup lang="ts">
useSeoMeta({ title: '設定' })

const { settings, setTheme, setAccentColor, setBgColor, resetColors } = useAppSettings()

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
  { value: 'light', label: '淺色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'system', label: '跟隨系統', icon: '💻' },
]

const hasCustomColors = computed(
  () => Boolean(settings.value.accentColor) || Boolean(settings.value.bgColor),
)

const localAccent = ref(settings.value.accentColor ?? '#0e8f7f')
const localBg = ref(settings.value.bgColor ?? '#f7f4ef')

watch(
  () => settings.value.accentColor,
  (v) => { if (v) localAccent.value = v },
)
watch(
  () => settings.value.bgColor,
  (v) => { if (v) localBg.value = v },
)

function handleAccentChange(e: Event): void {
  const color = (e.target as HTMLInputElement).value
  localAccent.value = color
  setAccentColor(color)
}

function handleBgChange(e: Event): void {
  const color = (e.target as HTMLInputElement).value
  localBg.value = color
  setBgColor(color)
}

function handleReset(): void {
  localAccent.value = '#0e8f7f'
  localBg.value = '#f7f4ef'
  resetColors()
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
    <!-- 色彩主題 -->
    <section class="timeline-card rounded-2xl p-6">
      <p class="mb-4 text-sm font-semibold text-[var(--text-main)]">色彩主題</p>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          :class="
            settings.theme === option.value
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'text-[var(--text-subtle)] border-[var(--surface-line)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
          "
          @click="setTheme(option.value)"
        >
          <span>{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>
    </section>

    <!-- 自定義色彩 -->
    <section class="timeline-card rounded-2xl p-6">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm font-semibold text-[var(--text-main)]">自定義色彩</p>
        <button
          v-if="hasCustomColors"
          class="text-xs text-[var(--text-subtle)] underline underline-offset-2 hover:text-[var(--accent)]"
          @click="handleReset"
        >
          還原預設
        </button>
      </div>
      <div class="space-y-4">
        <!-- 主題色 -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-[var(--text-main)]">主題色</p>
            <p class="mt-0.5 text-xs text-[var(--text-subtle)]">按鈕、連結、標記顏色</p>
          </div>
          <label class="relative flex cursor-pointer items-center gap-2">
            <span
              class="h-8 w-8 rounded-full border-2 border-[var(--surface-line)] shadow-sm"
              :style="{ backgroundColor: localAccent }"
            />
            <input
              type="color"
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              :value="localAccent"
              @input="handleAccentChange"
            />
          </label>
        </div>
        <!-- 背景色 -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-[var(--text-main)]">背景色</p>
            <p class="mt-0.5 text-xs text-[var(--text-subtle)]">頁面底色</p>
          </div>
          <label class="relative flex cursor-pointer items-center gap-2">
            <span
              class="h-8 w-8 rounded-full border-2 border-[var(--surface-line)] shadow-sm"
              :style="{ backgroundColor: localBg }"
            />
            <input
              type="color"
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              :value="localBg"
              @input="handleBgChange"
            />
          </label>
        </div>
      </div>
    </section>
  </main>
</template>
