type AppSettings = {
  theme: 'light' | 'dark' | 'system'
  locale: 'zh-TW'
  accentColor?: string
  bgColor?: string
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
    return {
      theme: ['light', 'dark', 'system'].includes(parsed.theme as string)
        ? (parsed.theme as AppSettings['theme'])
        : defaultSettings.theme,
      locale: 'zh-TW',
      accentColor: typeof parsed.accentColor === 'string' ? parsed.accentColor : undefined,
      bgColor: typeof parsed.bgColor === 'string' ? parsed.bgColor : undefined,
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

function applyCustomColors(accentColor?: string, bgColor?: string): void {
  const html = document.documentElement
  if (accentColor) {
    html.style.setProperty('--accent', accentColor)
    html.style.setProperty('--nav-accent', accentColor)
  } else {
    html.style.removeProperty('--accent')
    html.style.removeProperty('--nav-accent')
  }
  if (bgColor) {
    html.style.setProperty('--surface-bg', bgColor)
  } else {
    html.style.removeProperty('--surface-bg')
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
  }

  function setAccentColor(color: string | null): void {
    if (!import.meta.client) return
    const next: AppSettings = { ...settings.value }
    if (color) next.accentColor = color
    else delete next.accentColor
    saveSettings(next)
    applyCustomColors(next.accentColor, next.bgColor)
  }

  function setBgColor(color: string | null): void {
    if (!import.meta.client) return
    const next: AppSettings = { ...settings.value }
    if (color) next.bgColor = color
    else delete next.bgColor
    saveSettings(next)
    applyCustomColors(next.accentColor, next.bgColor)
  }

  function resetColors(): void {
    if (!import.meta.client) return
    const next: AppSettings = { theme: settings.value.theme, locale: 'zh-TW' }
    saveSettings(next)
    applyCustomColors()
  }

  function initSettings(): void {
    if (!import.meta.client) return
    const stored = readStoredSettings()
    settings.value = stored
    setupSystemListener()
    applyTheme(stored.theme, sharedMediaQuery)
    applyCustomColors(stored.accentColor, stored.bgColor)
  }

  return {
    settings: settings as Readonly<Ref<AppSettings>>,
    setTheme,
    setAccentColor,
    setBgColor,
    resetColors,
    initSettings,
  }
}
