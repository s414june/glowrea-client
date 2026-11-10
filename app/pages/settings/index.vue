<script setup lang="ts">
import {
  accentColorOptions,
  accentForegroundColor,
  darkBackgroundOptions,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_DARK_BACKGROUND,
  DEFAULT_DARK_BACKGROUND_SELECTION,
  DEFAULT_LIGHT_BACKGROUND,
  DEFAULT_LIGHT_BACKGROUND_SELECTION,
  lightBackgroundOptions,
  type ThemeColorOption,
} from '~/utils/theme-colors'

useSeoMeta({ title: '設定' })

const {
  settings,
  setTheme,
  setAccentColor,
  setLightBgColor,
  setDarkBgColor,
  resetColors,
} = useAppSettings()

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
  { value: 'light', label: '淺色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'system', label: '跟隨系統', icon: '💻' },
]

const hasCustomColors = computed(() => Boolean(
  settings.value.accentColor || settings.value.lightBgChoice || settings.value.lightBgColor || settings.value.darkBgChoice || settings.value.darkBgColor,
))

const selectedAccentColor = computed(() => settings.value.accentColor || DEFAULT_ACCENT_COLOR)
const selectedLightBackground = computed(() => settings.value.lightBgColor || DEFAULT_LIGHT_BACKGROUND)
const selectedDarkBackground = computed(() => settings.value.darkBgColor || DEFAULT_DARK_BACKGROUND)
const selectedLightChoice = computed(() => settings.value.lightBgChoice || DEFAULT_LIGHT_BACKGROUND_SELECTION)
const selectedDarkChoice = computed(() => settings.value.darkBgChoice || DEFAULT_DARK_BACKGROUND_SELECTION)

function groupOptions(options: ThemeColorOption[]) {
  const groups = new Map<string, ThemeColorOption[]>()
  for (const option of options) {
    const separator = option.key.lastIndexOf('-')
    const family = separator > 0 && /^\d+$/.test(option.key.slice(separator + 1))
      ? option.key.slice(0, separator)
      : option.label
    const group = groups.get(family) || []
    group.push(option)
    groups.set(family, group)
  }
  return [...groups].map(([name, colors]) => ({ name, colors }))
}

const accentGroups = computed(() => groupOptions(accentColorOptions))
const lightGroups = computed(() => groupOptions(lightBackgroundOptions))
const darkGroups = computed(() => groupOptions(darkBackgroundOptions))

function shadeLabel(option: ThemeColorOption): string {
  const shade = option.key.split('-').at(-1)
  return /^\d+$/.test(shade || '') ? shade! : ''
}

function shadeTextClass(color: string): string {
  return accentForegroundColor(color) === '#18181b' ? 'text-black/70' : 'text-white'
}

function handleReset(): void {
  resetColors()
}
</script>

<template>
  <main class="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 lg:mx-0 lg:ml-6">
    <section class="timeline-card rounded-2xl p-6">
      <p class="mb-4 text-sm font-semibold text-[var(--text-main)]">色彩主題</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          :class="settings.theme === option.value
            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
            : 'border-[var(--surface-line)] text-[var(--text-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)]'"
          @click="setTheme(option.value)"
        >
          <span>{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>
    </section>

    <section class="timeline-card rounded-2xl p-6">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-[var(--text-main)]">自訂色彩</h2>
        <button
          v-if="hasCustomColors"
          type="button"
          class="text-xs text-[var(--text-subtle)] underline underline-offset-2 hover:text-[var(--accent)]"
          @click="handleReset"
        >還原預設</button>
      </div>

      <section class="border-b border-[var(--surface-line)] pb-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-medium text-[var(--text-main)]">主題色</h3>
          <span class="h-6 w-6 rounded-full border border-[var(--surface-line)]" :style="{ backgroundColor: selectedAccentColor }" />
        </div>
        <div class="max-h-72 space-y-1 overflow-y-auto pr-1">
          <div v-for="family in accentGroups" :key="family.name" class="flex min-h-9 items-center gap-2">
            <span class="w-16 shrink-0 text-xs text-[var(--text-subtle)]">{{ family.name }}</span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="option in family.colors"
                :key="option.key"
                type="button"
                class="flex h-8 w-9 flex-col items-center justify-center rounded-lg border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                :class="selectedAccentColor === option.value ? 'ring-2 ring-[var(--accent)] ring-offset-1' : ''"
                :style="{ backgroundColor: option.value }"
                :aria-label="option.label"
                :aria-pressed="selectedAccentColor === option.value"
                :title="option.label"
                @click="setAccentColor(option.value)"
              ><span class="text-[9px] font-medium" :class="shadeTextClass(option.value)">{{ shadeLabel(option) }}</span></button>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-[var(--surface-line)] py-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-medium text-[var(--text-main)]">深色</h3>
          <span class="h-6 w-6 rounded-full border border-[var(--surface-line)]" :style="{ backgroundColor: selectedDarkBackground }" />
        </div>
        <div class="max-h-56 space-y-1 overflow-y-auto pr-1">
          <div v-for="family in darkGroups" :key="family.name" class="flex min-h-9 items-center gap-2">
            <span class="w-16 shrink-0 text-xs text-[var(--text-subtle)]">{{ family.name }}</span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="option in family.colors"
                :key="option.key"
                type="button"
                class="flex h-8 w-10 items-center justify-center rounded-lg border border-white/20 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                :class="selectedDarkChoice === option.key ? 'ring-2 ring-[var(--accent)] ring-offset-1' : ''"
                :style="{ backgroundColor: option.value }"
                :aria-label="option.label"
                :aria-pressed="selectedDarkChoice === option.key"
                :title="option.label"
                @click="setDarkBgColor(option.key)"
              ><span class="text-[9px] font-medium text-white">{{ shadeLabel(option) }}</span></button>
            </div>
          </div>
        </div>
      </section>

      <section class="pt-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-medium text-[var(--text-main)]">淺色</h3>
          <span class="h-6 w-6 rounded-full border border-[var(--surface-line)]" :style="{ backgroundColor: selectedLightBackground }" />
        </div>
        <div class="max-h-72 space-y-1 overflow-y-auto pr-1">
          <div v-for="family in lightGroups" :key="family.name" class="flex min-h-9 items-center gap-2">
            <span class="w-16 shrink-0 text-xs text-[var(--text-subtle)]">{{ family.name }}</span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="option in family.colors"
                :key="option.key"
                type="button"
                class="flex h-8 w-10 items-center justify-center rounded-lg border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                :class="selectedLightChoice === option.key ? 'ring-2 ring-[var(--accent)] ring-offset-1' : ''"
                :style="{ backgroundColor: option.value }"
                :aria-label="option.label"
                :aria-pressed="selectedLightChoice === option.key"
                :title="option.label"
                @click="setLightBgColor(option.key)"
              ><span class="text-[9px] font-medium text-black/70">{{ shadeLabel(option) }}</span></button>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
