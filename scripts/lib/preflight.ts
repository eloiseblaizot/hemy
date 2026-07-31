/**
 * Contrôle préalable : la base est-elle bien migrée ?
 *
 * Sans ce garde-fou, une base vide produit une erreur interne de Prisma
 * (« The table public.IngestRun does not exist ») qui ne dit pas quoi faire.
 * Cas typique : on lance l'ingestion avant d'avoir appliqué les migrations.
 */
import { prisma, connectionString } from './prisma'

/** Tables indispensables, dont `search_index` créée par une migration SQL manuelle. */
const REQUISES = ['Elu', 'Groupe', 'Scrutin', 'VoteNominatif', 'IngestRun', 'StatPresence', 'search_index']

function hote(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return '(URL illisible)'
  }
}

export async function verifierSchema(): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<{ nom: string; existe: boolean }[]>(
    `SELECT t.nom, to_regclass('public."' || t.nom || '"') IS NOT NULL AS existe
     FROM unnest($1::text[]) AS t(nom)`,
    REQUISES,
  )
  const manquantes = rows.filter((r) => !r.existe).map((r) => r.nom)
  if (!manquantes.length) return

  const toutes = manquantes.length === REQUISES.length
  console.error(
    `\n✖ La base ${hote(connectionString)} n'est pas à jour : ` +
      (toutes ? 'aucune table n\'existe.' : `table(s) manquante(s) : ${manquantes.join(', ')}.`),
  )
  console.error('\n  Appliquez les migrations, puis relancez :\n')
  console.error('    npx prisma migrate deploy\n')
  console.error("  (en production, pensez à pointer DIRECT_URL sur la base visée)\n")
  process.exit(1)
}
