// Contrôle des cas sensibles de l'indicateur. `npx tsx scripts/test-presence.ts`
import { prisma, closeDb } from './lib/prisma'
import { estPointEntree } from './lib/cli'
import { MOTIFS } from '../shared/presence'

async function fiche(nom: string) {
  const elu = await prisma.elu.findFirst({
    where: { nom, chambre: 'AN' },
    include: { stats: true, groupe: true },
  })
  if (!elu) return console.log(`  ${nom} : introuvable`)
  console.log(`\n  ${elu.prenom} ${elu.nom} [${elu.groupe?.code}]`)
  for (const s of elu.stats.sort((a) => (a.perimetre === 'SOLENNEL' ? -1 : 1))) {
    const denom = s.eligibles - s.neutralises
    const verdict = s.applicable
      ? `${s.taux?.toFixed(1)} %  (${s.personnels} personnels / ${denom})`
      : `NON APPLICABLE — ${MOTIFS[s.motif ?? ''] ?? s.motif}`
    console.log(
      `    ${s.perimetre.padEnd(9)} ${verdict}\n` +
        `              éligibles=${s.eligibles} neutralisés=${s.neutralises} délégations=${s.delegations}`,
    )
  }
}

async function main() {
  console.log('=== Cas sensibles ===')
  // Présidente de l'Assemblée : listée non-votante à chaque scrutin.
  // Un calcul naïf la placerait 1re à 100 %.
  await fiche('Braun-Pivet')
  // Record de votes par délégation : ne doit pas être crédité de ces votes.
  await fiche('Brosse')
  // Arrivée en cours de législature : le dénominateur doit être borné.
  await fiche('Paillat')
  // Cas ordinaire de référence.
  await fiche('David')

  console.log('\n=== Bornes de cohérence ===')
  const aberrants = await prisma.statPresence.count({ where: { taux: { gt: 100 } } })
  console.log(`  taux > 100 % : ${aberrants} (doit être 0)`)
  const negatifs = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT count(*) n FROM "StatPresence" WHERE eligibles < neutralises + personnels`,
  )
  console.log(`  numérateur > dénominateur : ${Number(negatifs[0].n)} (doit être 0)`)
  const senat = await prisma.statPresence.count({ where: { elu: { chambre: 'SENAT' } } })
  console.log(`  indicateurs pour des sénateurs : ${senat} (doit être 0 — donnée inexistante au Sénat)`)

  const distri = await prisma.statDistribution.findMany()
  console.log('\n=== Distribution publiée ===')
  for (const d of distri) {
    console.log(`  ${d.chambre} ${d.perimetre.padEnd(9)} n=${d.nbElus} médiane=${d.mediane.toFixed(1)} % p10=${d.p10.toFixed(1)} p90=${d.p90.toFixed(1)}`)
  }
}

if (estPointEntree(import.meta.url)) {
  await main()
  await closeDb()
}
