import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { P as PrismaClient, u as urlPoolee } from './db-url.mjs';

var _a;
const connectionString = urlPoolee();
const globalForPrisma = globalThis;
function createClient() {
  const pool = new Pool({
    connectionString,
    // Une fonction serverless sert peu de requêtes concurrentes : un pool étroit
    // évite d'épuiser les connexions Postgres quand les instances se multiplient.
    max: 3,
    // Le défaut de l'adapter v7 est « illimité » : une requête pendante bloquerait
    // jusqu'au timeout de la fonction.
    connectionTimeoutMillis: 1e4,
    idleTimeoutMillis: 1e4
  });
  globalForPrisma.__pool = pool;
  if (process.env.VERCEL) {
    void import('@vercel/functions').then(({ attachDatabasePool }) => attachDatabasePool(pool)).catch(() => {
    });
  }
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
const prisma = (_a = globalForPrisma.__prisma) != null ? _a : createClient();

export { prisma as p };
//# sourceMappingURL=db.mjs.map
