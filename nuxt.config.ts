// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      titleTemplate: '%s｜Glowrea',
      title: 'Glowrea',
    },
  },
  runtimeConfig: {
    mastodonApiBase: '',
    mastodonToken: '',
    authSessionSecret: '',
    public: {
      mastodonApiBase: ''
    }
  }
})
