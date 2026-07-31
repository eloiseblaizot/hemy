// Statistiques de la base. `npm run stats`
import { prisma, closeDb } from './lib/prisma'
import { estPointEntree } from './lib/cli'

async function main() {
  for (const ch of ['AN', 'SENAT'] as const) {
    const [scrutins, elus, actifs, groupes] = await Promise.all([
      prisma.scrutin.count({ where: { chambre: ch } }),
      prisma.elu.count({ where: { chambre: ch } }),
      prisma.elu.count({ where: { chambre: ch, actif: true } }),
      prisma.groupe.count({ where: { chambre: ch } }),
    ])
    const d = await prisma.scrutin.aggregate({
      where: { chambre: ch },
      _min: { date: true },
      _max: { date: true },
    })
    console.log(
      `${ch.padEnd(6)} scrutins=${scrutins}  élus=${elus} (${actifs} actifs)  groupes=${groupes}  ` +
        `${d._min.date?.toISOString().slice(0, 10)} → ${d._max.date?.toISOString().slice(0, 10)}`,
    )
  }
  console.log(`votes nominatifs = ${await prisma.voteNominatif.count()}`)
  console.log(`analyses par groupe = ${await prisma.scrutinGroupe.count()}`)

  const taille = await prisma.$queryRawUnsafe<{ t: string }[]>(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS t`,
  )
  console.log(`taille de la base = ${taille[0].t}`)

  const tables = await prisma.$queryRawUnsafe<{ nom: string; total: string }[]>(`
    SELECT relname AS nom, pg_size_pretty(pg_total_relation_size(c.oid)) AS total
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 6
  `)
  for (const t of tables) console.log(`   ${t.nom.padEnd(20)} ${t.total}`)

  const runs = await prisma.ingestRun.findMany({ orderBy: { startedAt: 'desc' }, take: 3 })
  console.log('\ndernières synchronisations :')
  for (const r of runs) {
    console.log(
      `   ${r.startedAt.toISOString().slice(0, 16)} ${r.source} ${r.ok ? '✓' : '✖'} ` +
        `+${r.nbNouveaux}/~${r.nbMaj} ${r.message ?? r.erreur ?? ''}`,
    )
  }
}

if (estPointEntree(import.meta.url)) {
  await main()
  await closeDb()
}
