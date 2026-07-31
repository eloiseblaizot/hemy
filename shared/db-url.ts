/**
 * Résolution de l'URL de base de données.
 *
 * L'intégration Neon de Vercel injecte plusieurs variables sans demander leur
 * avis : `DATABASE_URL` (poolée), `DATABASE_URL_UNPOOLED` (directe), et les
 * variantes `POSTGRES_*`. On les accepte toutes pour qu'un déploiement
 * fonctionne sans avoir à créer de variable à la main.
 *
 * Poolée   : runtime serverless (beaucoup d'instances, peu de requêtes chacune).
 * Directe  : migrations et ingestion (un pooler en mode transaction n'aime ni
 *            les transactions longues ni COPY).
 */
const premiere = (...noms: string[]): string => {
  for (const n of noms) {
    const v = process.env[n]
    if (v && v.trim()) return v.trim()
  }
  return ''
}

/** URL pour le site (poolée de préférence). */
export function urlPoolee(): string {
  return premiere('DATABASE_URL', 'POSTGRES_URL', 'DIRECT_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING')
}

/** URL pour les migrations et l'ingestion (directe de préférence). */
export function urlDirecte(): string {
  return premiere('DIRECT_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL', 'POSTGRES_URL')
}
