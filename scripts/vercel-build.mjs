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

run('prisma generate')

const env = process.env.VERCEL_ENV
const aUneBase = Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL)

if (!aUneBase) {
  console.warn('\n⚠  Ni DIRECT_URL ni DATABASE_URL : migrations ignorées.')
} else if (!env || env === 'production') {
  run('prisma migrate deploy')
} else {
  console.log(`\n↷ VERCEL_ENV=${env} : migrations ignorées (réservées à la production).`)
}

run('nuxt build')
