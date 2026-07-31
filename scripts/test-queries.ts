// Test de la couche de requêtes (sans HTTP). `npx tsx scripts/test-queries.ts`
import { prisma } from './lib/prisma'
import {
  latestScrutins,
  scrutinDetail,
  searchAll,
  eluBySlug,
  eluVotes,
  departements,
  chambreOverview,
  elusByDepartement,
} from '../server/utils/queries'

async function main() {
  console.log('== latestScrutins AN ==')
  const latest = await latestScrutins({ chambre: 'AN', limit: 2 })
  for (const s of latest) console.log(` n°${s.numero} ${s.date.toISOString().slice(0, 10)} ${s.sortCode} P${s.pour}/C${s.contre} — ${s.titre.slice(0, 50)}`)

  console.log('\n== scrutinDetail (premier) ==')
  const det = await scrutinDetail(latest[0].id)
  console.log(' groupes:', det?.groupes.length, '| sièges:', det?.sieges.length)
  console.log(' 1er groupe:', det?.groupes[0] && `${det.groupes[0].code} P${det.groupes[0].pour}/C${det.groupes[0].contre} (maj ${det.groupes[0].positionMajoritaire})`)
  console.log(' 1er siège:', det?.sieges[0] && `${det.sieges[0].prenom} ${det.sieges[0].nom} [${det.sieges[0].groupeCode}] ${det.sieges[0].position} couleur=${det.sieges[0].couleur} ordre=${det.sieges[0].ordre}`)

  console.log('\n== search "narcotrafic" ==')
  for (const r of (await searchAll('narcotrafic', 5))) console.log(` [${r.type}/${r.chambre}] ${r.label.slice(0, 50)} — ${r.sub}`)

  console.log('\n== search "borne" (élu) ==')
  for (const r of (await searchAll('borne', 5))) console.log(` [${r.type}/${r.chambre}] ${r.label} — ${r.sub}`)

  console.log('\n== eluBySlug + votes ==')
  const someElu = await prisma.elu.findFirst({ where: { chambre: 'AN', actif: true, nom: 'David' } })
  if (someElu) {
    const prof = await eluBySlug(someElu.slug)
    console.log(` ${prof?.elu.prenom} ${prof?.elu.nom} (${prof?.elu.groupe?.code}, ${prof?.elu.departement}) — total votes ${prof?.total}`, prof?.stats)
    const v = await eluVotes(someElu.id, { limit: 2 })
    console.log(' derniers votes:', v.votes.map((x) => `${x.position} sur "${x.scrutin.titre.slice(0, 40)}"`))
  }

  console.log('\n== departements ==')
  const deps = await departements()
  console.log(' nb:', deps.length, '| ex:', deps.filter((d) => ['18', '33', '75'].includes(d.code)).map((d) => `${d.code} ${d.nom} (AN ${d.an}/Sénat ${d.senat})`))

  console.log('\n== élus du Cher (18) ==')
  const cher = await elusByDepartement('18')
  console.log(cher.map((e) => `${e.chambre} ${e.prenom} ${e.nom} [${e.groupe?.code}]${e.numCirco ? ' circo ' + e.numCirco : ''}`).join('\n'))

  console.log('\n== chambreOverview SENAT ==')
  const ov = await chambreOverview('SENAT')
  console.log(' groupes actifs:', ov.groupes.length, '| total scrutins:', ov.totalScrutins)
  console.log(ov.groupes.map((g) => `${g.code}:${g.nbMembres}`).join('  '))

  await prisma.$disconnect()
}
main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
