import {
  accentForegroundColor,
  normalizeDarkBackgroundSelection,
  normalizeLightBackgroundSelection,
  resolveDarkBackgroundColor,
  resolveDarkSurfaceColors,
  resolveLightBackgroundColor,
  resolveLightSurfaceColors,
} from '~/utils/theme-colors'

type AppSettings = {
  theme: 'light' | 'dark' | 'system'
  locale: 'zh-TW'
  accentColor?: string
  accentForeground?: string
  lightBgChoice?: string
  lightBgColor?: string
  lightCardColor?: string
  lightLineColor?: string
  darkBgChoice?: string
  darkBgColor?: string
  darkCardColor?: string
  darkLineColor?: string
}

const STORAGE_KEY = 'glowrea:settings'

const defaultSettings: AppSettings = {
  theme: 'system',
  locale: 'zh-TW',
}

function readStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const legacyBgColor = typeof (parsed as { bgColor?: unknown }).bgColor === 'string'
      ? (parsed as { bgColor: string }).bgColor
      : undefined
    const legacyBgIsDark = legacyBgColor ? isLikelyDarkHex(legacyBgColor) : false
    const lightBgChoice = typeof parsed.lightBgChoice === 'string'
      ? parsed.lightBgChoice
      : typeof parsed.lightBgColor === 'string' ? parsed.lightBgColor : undefined
    const darkBgChoice = typeof parsed.darkBgChoice === 'string'
      ? parsed.darkBgChoice
      : typeof parsed.darkBgColor === 'string' ? parsed.darkBgColor : undefined
    const normalizedLightBgChoice = lightBgChoice ? normalizeLightBackgroundSelection(lightBgChoice) : undefined
    const normalizedDarkBgChoice = darkBgChoice ? normalizeDarkBackgroundSelection(darkBgChoice) : undefined
    const lightSurfaceColors = normalizedLightBgChoice ? resolveLightSurfaceColors(normalizedLightBgChoice) : undefined
    const darkSurfaceColors = normalizedDarkBgChoice ? resolveDarkSurfaceColors(normalizedDarkBgChoice) : undefined
    const legacyLight = legacyBgColor && !legacyBgIsDark ? legacyBgColor : undefined
    const legacyDark = legacyBgColor && legacyBgIsDark ? legacyBgColor : undefined
    return {
      theme: ['light', 'dark', 'system'].includes(parsed.theme as string)
        ? (parsed.theme as AppSettings['theme'])
        : defaultSettings.theme,
      locale: 'zh-TW',
      accentColor: typeof parsed.accentColor === 'string' ? parsed.accentColor : undefined,
      accentForeground: typeof parsed.accentColor === 'string' ? accentForegroundColor(parsed.accentColor) : undefined,
      lightBgChoice: normalizedLightBgChoice,
      lightBgColor: typeof parsed.lightBgChoice === 'string' && typeof parsed.lightBgColor === 'string'
        ? parsed.lightBgColor
        : normalizedLightBgChoice ? resolveLightBackgroundColor(normalizedLightBgChoice) : legacyLight,
      lightCardColor: typeof parsed.lightCardColor === 'string' ? parsed.lightCardColor : lightSurfaceColors?.card,
      lightLineColor: typeof parsed.lightLineColor === 'string' ? parsed.lightLineColor : lightSurfaceColors?.line,
      darkBgChoice: normalizedDarkBgChoice,
      darkBgColor: typeof parsed.darkBgChoice === 'string' && typeof parsed.darkBgColor === 'string'
        ? parsed.darkBgColor
        : normalizedDarkBgChoice ? resolveDarkBackgroundColor(normalizedDarkBgChoice) : legacyDark,
      darkCardColor: darkSurfaceColors?.card || (typeof parsed.darkCardColor === 'string' ? parsed.darkCardColor : undefined),
      darkLineColor: typeof parsed.darkLineColor === 'string' ? parsed.darkLineColor : darkSurfaceColors?.line,
    }
  } catch {
    return { ...defaultSettings }
  }
}

function applyTheme(theme: AppSettings['theme'], mediaQuery?: MediaQueryList): void {
  const html = document.documentElement
  html.classList.remove('light', 'dark')
  if (theme === 'light') {
    html.classList.add('light')
  } else if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    const mq = mediaQuery ?? window.matchMedia('(prefers-color-scheme: dark)')
    html.classList.add(mq.matches ? 'dark' : 'light')
  }
}

function isDarkTheme(theme: AppSettings['theme'], mediaQuery?: MediaQueryList): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return (mediaQuery ?? window.matchMedia('(prefers-color-scheme: dark)')).matches
}

function isLikelyDarkHex(color: string): boolean {
  const normalized = color.trim().replace(/^#/, '')
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(normalized)) return false
  const full = normalized.length === 3 ? [...normalized].map((part) => `${part}${part}`).join('') : normalized
  const channels = [0, 2, 4].map((index) => Number.parseInt(full.slice(index, index + 2), 16) / 255)
  const luminance = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * luminance[0]! + 0.7152 * luminance[1]! + 0.0722 * luminance[2]! < 0.5
}

function applyCustomColors(settings: AppSettings, mediaQuery?: MediaQueryList): void {
  const html = document.documentElement
  if (settings.accentColor) {
    html.style.setProperty('--accent', settings.accentColor)
    html.style.setProperty('--accent-foreground', settings.accentForeground || accentForegroundColor(settings.accentColor))
  } else {
    html.style.removeProperty('--accent')
    html.style.removeProperty('--accent-foreground')
  }

  const isDark = isDarkTheme(settings.theme, mediaQuery)
  const backgroundColor = isDark ? settings.darkBgColor : settings.lightBgColor
  const cardColor = isDark ? settings.darkCardColor : settings.lightCardColor
  const lineColor = isDark ? settings.darkLineColor : settings.lightLineColor
  for (const [property, color] of [
    ['--surface-bg', backgroundColor],
    ['--nav-bg', backgroundColor],
    ['--surface-card', cardColor],
    ['--surface-line', lineColor],
  ] as const) {
    if (color) html.style.setProperty(property, color)
    else html.style.removeProperty(property)
  }
}

// Module-level so the MediaQueryList and listener are shared across all composable instances
let sharedMediaQuery: MediaQueryList | undefined
let sharedMediaQueryListener: (() => void) | undefined

export function useAppSettings() {
  const settings = useState<AppSettings>('app-settings', () => ({ ...defaultSettings }))

  function setupSystemListener(): void {
    if (!import.meta.client) return
    if (sharedMediaQueryListener) return
    sharedMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    sharedMediaQueryListener = () => {
      if (settings.value.theme === 'system') {
        applyTheme('system', sharedMediaQuery)
        applyCustomColors(settings.value, sharedMediaQuery)
      }
    }
    sharedMediaQuery.addEventListener('change', sharedMediaQueryListener)
  }

  function saveSettings(next: AppSettings): void {
    settings.value = next
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage unavailable — silently ignore
    }
  }

  function setTheme(theme: AppSettings['theme']): void {
    if (!import.meta.client) return
    saveSettings({ ...settings.value, theme })
    applyTheme(theme, sharedMediaQuery)
    applyCustomColors(settings.value, sharedMediaQuery)
  }

  function setAccentColor(color: string | null): void {
    if (!import.meta.client) return
    const next: AppSettings = { ...settings.value }
    if (color) {
      next.accentColor = color
      next.accentForeground = accentForegroundColor(color)
    } else {
      delete next.accentColor
      delete next.accentForeground
    }
    saveSettings(next)
    applyCustomColors(next, sharedMediaQuery)
  }

  function setLightBgColor(selection: string | null): void {
    if (!import.meta.client) return
    const next: AppSettings = { ...settings.value }
    if (selection) {
      next.lightBgChoice = selection
      const colors = resolveLightSurfaceColors(selection)
      next.lightBgColor = colors?.background || resolveLightBackgroundColor(selection)
      if (colors) {
        next.lightCardColor = colors.card
        next.lightLineColor = colors.line
      } else {
        delete next.lightCardColor
        delete next.lightLineColor
      }
    } else {
      delete next.lightBgChoice
      delete next.lightBgColor
      delete next.lightCardColor
      delete next.lightLineColor
    }
    saveSettings(next)
    applyCustomColors(next, sharedMediaQuery)
  }

  function setDarkBgColor(selection: string | null): void {
    if (!import.meta.client) return
    const next: AppSettings = { ...settings.value }
    if (selection) {
      next.darkBgChoice = selection
      const colors = resolveDarkSurfaceColors(selection)
      next.darkBgColor = colors?.background || resolveDarkBackgroundColor(selection)
      if (colors) {
        next.darkCardColor = colors.card
        next.darkLineColor = colors.line
      } else {
        delete next.darkCardColor
        delete next.darkLineColor
      }
    } else {
      delete next.darkBgChoice
      delete next.darkBgColor
      delete next.darkCardColor
      delete next.darkLineColor
    }
    saveSettings(next)
    applyCustomColors(next, sharedMediaQuery)
  }

  function resetColors(): void {
    if (!import.meta.client) return
    const next: AppSettings = { theme: settings.value.theme, locale: 'zh-TW' }
    saveSettings(next)
    applyCustomColors(next, sharedMediaQuery)
  }

  function initSettings(): void {
    if (!import.meta.client) return
    const stored = readStoredSettings()
    settings.value = stored
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // localStorage unavailable — silently ignore
    }
    setupSystemListener()
    applyTheme(stored.theme, sharedMediaQuery)
    applyCustomColors(stored, sharedMediaQuery)
  }

  return {
    settings: settings as Readonly<Ref<AppSettings>>,
    setTheme,
    setAccentColor,
    setLightBgColor,
    setDarkBgColor,
    resetColors,
    initSettings,
  }
}
