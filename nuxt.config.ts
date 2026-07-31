import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: "Hemy — les votes à l'Assemblée nationale et au Sénat",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            "Visualisez les scrutins de l'Assemblée nationale et du Sénat, groupe par groupe, et suivez les votes de vos députés et sénateurs.",
        },
        { name: 'theme-color', content: '#0f172a' },
      ],
    },
  },

  nitro: {
    vercel: {
      functions: {
        // Nitro 2.13 déduit le runtime de la version Node de la machine de
        // build et ne connaît que 18/20/22 : sans ce réglage explicite on
        // retombe silencieusement sur nodejs22.x alors que Vercel est en 24.
        runtime: 'nodejs24.x',
        maxDuration: 60,
        memory: 1024,
        regions: ['cdg1'], // Paris
      },
      config: {
        version: 3,
        // Mise à jour quotidienne (heure UTC ; Hobby = 1 cron/jour maximum).
        // La synchronisation principale est portée par GitHub Actions ; ce cron
        // est le filet de sécurité côté Vercel.
        crons: [{ path: '/api/cron/sync', schedule: '20 5 * * *' }],
      },
    },
  },

  routeRules: {
    // Le contenu ne bouge qu'une fois par jour : on met le CDN à contribution.
    '/': { swr: 1800 },
    '/scrutins/**': { swr: 86400 },
    '/deputes/**': { swr: 3600 },
    '/senateurs/**': { swr: 3600 },
    '/groupes/**': { swr: 3600 },
    '/chambre/**': { swr: 1800 },
    '/mes-elus': { swr: 3600 },
    '/api/cron/**': { cache: false, headers: { 'cache-control': 'no-store' } },
    '/api/**': { cache: false },
  },
})
