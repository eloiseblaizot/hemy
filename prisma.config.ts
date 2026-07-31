import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// NB : on n'utilise PAS le helper `env()` de prisma/config ici. S'il ne trouve
// pas la variable, il fait échouer `prisma generate` (PrismaConfigEnvError) —
// or `generate` n'a pas besoin de base de données, et le build Vercel casserait
// avec un message incompréhensible. `process.env … ?? ''` est tolérant.
//
// DIRECT_URL : connexion directe (migrations, ingestion, COPY).
// DATABASE_URL : connexion poolée (runtime serverless).
const url = process.env.DIRECT_URL || process.env.DATABASE_URL || ''

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: { url },
})
