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
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
  if (typeof settings.accentColor === 'string') {
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--nav-accent', settings.accentColor);
  }
  if (typeof settings.bgColor === 'string') root.style.setProperty('--surface-bg', settings.bgColor);
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
