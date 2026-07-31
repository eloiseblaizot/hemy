/**
 * Build de production.
 *
 *  1. `prisma generate` — le client est régénéré à chaque build (il n'est pas
 *     committé, et Vercel met le cache des dépendances en cache).
 *  2. `prisma migrate deploy` — uniquement pour le déploiement de PRODUCTION :
 *     sans ce garde-fou, un déploiement de preview appliquerait ses migrations
 *     sur la base de production.
 *  3. `nuxt build`.
 */
import { execSync } from 'node:child_process'

const run = (cmd) => {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

// `nuxt prepare` d'abord : il crée .nuxt/tsconfig.json, que le CLI Prisma lit.
// Sans lui, `prisma generate` échoue sur un clone frais (ou quand Vercel
// restaure son cache de dépendances et saute le postinstall).
run('nuxt prepare')
run('prisma generate')

const env = process.env.VERCEL_ENV
const aUneBase = ['DIRECT_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL', 'POSTGRES_URL'].some(
  (n) => process.env[n]?.trim(),
)

if (!aUneBase) {
  console.warn('\n⚠  Aucune URL de base de données trouvée : migrations ignorées.')
} else if (!env || env === 'production') {
  run('prisma migrate deploy')
} else {
  console.log(`\n↷ VERCEL_ENV=${env} : migrations ignorées (réservées à la production).`)
}

run('nuxt build')
