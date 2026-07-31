import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Config volontairement en JavaScript et non en TypeScript : Prisma chargerait
// alors un moteur TS qui résout `tsconfig.json`, lequel étend `.nuxt/tsconfig.json`
// — absent d'un clone frais. Le build échouait donc sur Vercel avec
// « File './.nuxt/tsconfig.json' not found ».
//
// On n'utilise pas le helper `env()` : s'il ne trouve pas la variable, il fait
// échouer `prisma generate`, qui n'a pourtant pas besoin de base de données.
//
// DIRECT_URL : connexion directe (migrations, ingestion).
// DATABASE_URL : connexion poolée (runtime serverless).
// Les autres noms sont ceux injectés automatiquement par l'intégration Neon.
const url =
  [
    'DIRECT_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL',
    'POSTGRES_URL',
  ]
    .map((n) => process.env[n])
    .find((v) => v && v.trim()) ?? ''

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: { url },
})
