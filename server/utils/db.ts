// Singleton PrismaClient pour le serveur Nitro (auto-importé : `prisma`).
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'
import { urlPoolee } from '../../shared/db-url'

const connectionString = urlPoolee()

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient; __pool?: Pool }

function createClient(): PrismaClient {
  const pool = new Pool({
    connectionString,
    // Une fonction serverless sert peu de requêtes concurrentes : un pool étroit
    // évite d'épuiser les connexions Postgres quand les instances se multiplient.
    max: 3,
    // Le défaut de l'adapter v7 est « illimité » : une requête pendante bloquerait
    // jusqu'au timeout de la fonction.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
  })
  globalForPrisma.__pool = pool

  // Sur Vercel (fluid compute), ferme proprement les connexions inactives avant
  // la suspension de l'instance. Absent/no-op ailleurs.
  if (process.env.VERCEL) {
    void import('@vercel/functions')
      .then(({ attachDatabasePool }) => attachDatabasePool(pool))
      .catch(() => {})
  }

  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

export const prisma = globalForPrisma.__prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma
