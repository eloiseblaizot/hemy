/**
 * Client Prisma partagé.
 *
 * Utilisé par les scripts (via tsx) ET par la route cron du serveur Nitro : le
 * singleton passe par `globalThis` pour qu'un seul pool de connexions existe,
 * quel que soit le point d'entrée.
 *
 * Les scripts privilégient la connexion DIRECTE (migrations, gros chargements,
 * COPY, qui n'aiment pas un pooler en mode transaction).
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

const g = globalThis as unknown as { __prisma?: PrismaClient; __pool?: Pool }

export const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || ''

function creer(): PrismaClient {
  if (!connectionString) {
    throw new Error(
      'DIRECT_URL (ou DATABASE_URL) est absent. Copiez .env.example vers .env, ou lancez `npm run db:dev`.',
    )
  }
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 15_000 })
  g.__pool = pool
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

export const prisma: PrismaClient = g.__prisma ?? creer()
g.__prisma = prisma

export async function closeDb() {
  await prisma.$disconnect().catch(() => {})
  await g.__pool?.end().catch(() => {})
}
