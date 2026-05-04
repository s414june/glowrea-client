type AppSettings = {
  theme: 'light' | 'dark' | 'system'
  locale: 'zh-TW'
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
    html.classList.add(mediaQuery?.matches ? 'dark' : 'light')
  }
}

export function useAppSettings() {
  const settings = useState<AppSettings>('app-settings', () => ({ ...defaultSettings }))

  let mediaQuery: MediaQueryList | undefined
  let mediaQueryListener: (() => void) | undefined

  function setupSystemListener(): void {
    if (!import.meta.client) return
    if (mediaQueryListener) return

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryListener = () => {
      if (settings.value.theme === 'system') {
        applyTheme('system', mediaQuery)
      }
    }
    mediaQuery.addEventListener('change', mediaQueryListener)
  }

  function setTheme(theme: AppSettings['theme']): void {
    if (!import.meta.client) return
    settings.value = { ...settings.value, theme }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    } catch {
      // localStorage unavailable — silently ignore
    }
    applyTheme(theme, mediaQuery)
  }

  function initSettings(): void {
    if (!import.meta.client) return
    const stored = readStoredSettings()
    settings.value = stored
    setupSystemListener()
    applyTheme(stored.theme, window.matchMedia('(prefers-color-scheme: dark)'))
  }

  return {
    settings: settings as Readonly<Ref<AppSettings>>,
    setTheme,
    initSettings,
  }
}
