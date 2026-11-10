// https://nuxt.com/docs/api/configuration/nuxt-config
const themeBootstrapScript = `(() => {
  const root = document.documentElement;
  let settings = {};
  try {
    const stored = JSON.parse(localStorage.getItem('glowrea:settings') || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) settings = stored;
  } catch {}
  const themeValue = settings.theme;
  const theme = themeValue === 'light' || themeValue === 'dark' || themeValue === 'system' ? themeValue : 'system';
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  function accentForeground(color) {
    const lightness = color.match(/^oklch\\(([\\d.]+)%/)?.[1];
    if (lightness) return Number(lightness) > 54 ? '#18181b' : '#ffffff';
    const normalized = color.trim().replace(/^#/, '');
    if (!/^(?:[\\da-f]{3}|[\\da-f]{6})$/i.test(normalized)) return '#ffffff';
    const full = normalized.length === 3 ? [...normalized].map(part => part + part).join('') : normalized;
    const channels = [0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16) / 255);
    const luminance = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? '#ffffff' : '#18181b';
  }
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
  if (typeof settings.accentColor === 'string') {
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--accent-foreground', typeof settings.accentForeground === 'string' ? settings.accentForeground : accentForeground(settings.accentColor));
  }
  const backgroundColor = dark ? settings.darkBgColor : settings.lightBgColor;
  if (typeof backgroundColor === 'string') {
    root.style.setProperty('--surface-bg', backgroundColor);
    root.style.setProperty('--nav-bg', backgroundColor);
  }
  const cardColor = dark ? settings.darkCardColor : settings.lightCardColor;
  if (typeof cardColor === 'string') root.style.setProperty('--surface-card', cardColor);
  const lineColor = dark ? settings.darkLineColor : settings.lightLineColor;
  if (typeof lineColor === 'string') root.style.setProperty('--surface-line', lineColor);
})();`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      titleTemplate: '%s｜Glowrea',
      title: 'Glowrea',
      script: [{ innerHTML: themeBootstrapScript, tagPosition: 'head', tagPriority: 'critical' }],
    },
  },
  runtimeConfig: {
    appOrigin: '',
    mastodonApiBase: '',
    mastodonClientId: '',
    mastodonClientSecret: '',
    authSessionSecret: '',
    public: {
      mastodonApiBase: ''
    }
  }
})
