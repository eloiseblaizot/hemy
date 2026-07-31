/**
 * Synchronisation des scrutins (Assemblée nationale + Sénat).
 *
 * Fonctionne par RÉCONCILIATION D'ENSEMBLES : on compare les identifiants
 * publiés à ceux en base. Conséquences voulues — le job est insensible à un
 * run manqué comme à un run dupliqué, il comble les trous historiques, et il
 * ne dépend pas d'un « dernier numéro » (le numéro est du texte : MAX() y
 * renvoie « 999 »).
 *
 *   npm run sync            mise à jour incrémentale (défaut)
 *   npm run sync:full       recharge tout (backfill initial)
 *
 * Variables : SYNC_FULL=1, SYNC_CHAMBRE=AN|SENAT, SYNC_MAX=<n> (plafond de
 * scrutins traités par run), SENAT_SESSIONS=2025,2024, INGEST_FORCE=1.
 */
import { prisma, closeDb } from './lib/prisma'
import {
  anReferentiel,
  anManifest,
  anZipHead,
  anFetchScrutin,
  anAllScrutins,
  AN_LEGISLATURE,
} from './lib/an-source'
import {
  senatReferentiel,
  senatListeSession,
  senatVotes,
  senatSessionCourante,
  cleDepartement,
} from './lib/senat-source'
import {
  upsertGroupes,
  upsertElus,
  replaceAppartenances,
  preparerScrutinAN,
  preparerScrutinSenat,
  ecrireScrutins,
  debuterRun,
  terminerRun,
  synchronisationEnCours,
} from './lib/store'
import { calculerPresence } from './compute-presence'
import { reindexerRecherche } from './reindex-search'

const FULL = process.env.SYNC_FULL === '1'
const FORCE = process.env.INGEST_FORCE === '1'
const CHAMBRE = process.env.SYNC_CHAMBRE?.toUpperCase()
const MAX = process.env.SYNC_MAX ? Number.parseInt(process.env.SYNC_MAX, 10) : 0
const CONCURRENCE = 6 // serveurs institutionnels : on reste courtois
const LOT = 250 // scrutins écrits par lot (≈ 40 000 votes, quelques requêtes)

async function enLots<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += n) {
    out.push(...(await Promise.all(items.slice(i, i + n).map(fn))))
  }
  return out
}

// ------------------------------------------------------------------------- AN

async function syncAN() {
  console.log('\n▸ Assemblée nationale')
  let nouveaux = 0
  let maj = 0

  const ref = await anReferentiel(FORCE)
  await upsertGroupes(ref.groupes, 'AN', AN_LEGISLATURE)
  await upsertElus(ref.elus, 'AN', AN_LEGISLATURE)
  const nbApp = await replaceAppartenances(ref.appartenances, 'AN')
  console.log(`  référentiel : ${ref.groupes.length} groupes, ${ref.elus.length} députés, ${nbApp} mandats`)

  // État publié vs état en base.
  const head = await anZipHead()
  const enBase = await prisma.scrutin.findMany({
    where: { chambre: 'AN' },
    select: { id: true, sourceChecksum: true },
  })
  const checksums = new Map(enBase.map((s) => [s.id, s.sourceChecksum]))

  // Sonde à 22 octets : si le compte publié égale le compte en base, il n'y a
  // rien de nouveau et on s'arrête là (le manifeste n'est même pas téléchargé).
  if (!FULL && head.total === checksums.size) {
    console.log(`  ${head.total} scrutins publiés, autant en base — rien de neuf`)
    return { nouveaux, maj }
  }

  const { entries } = await anManifest(head)
  console.log(`  manifeste : ${entries.length} scrutins publiés, ${checksums.size} en base`)

  let aTraiter = entries.filter((e) => {
    const id = `VTANR5L17V${e.numero}`
    if (!checksums.has(id)) return true // nouveau
    return checksums.get(id) !== e.crc // corrigé à la source
  })
  aTraiter.sort((a, b) => b.numero - a.numero) // les plus récents d'abord
  if (MAX > 0) aTraiter = aTraiter.slice(0, MAX)
  if (!aTraiter.length) {
    console.log('  aucun scrutin nouveau ni corrigé')
    return { nouveaux, maj }
  }
  console.log(`  ${aTraiter.length} scrutin(s) à traiter`)

  // Au-delà de ~600 scrutins, un seul téléchargement complet coûte moins cher
  // que des milliers de requêtes Range.
  if (aTraiter.length > 600) {
    const voulus = new Set(aTraiter.map((e) => e.numero))
    console.log('  → téléchargement complet du zip (plus efficace à ce volume)')
    const scrutins = (await anAllScrutins(FORCE, (n) => voulus.has(n), head.total)).filter((x) => x.scrutin?.uid)
    for (let i = 0; i < scrutins.length; i += LOT) {
      const lot = scrutins.slice(i, i + LOT).map((x) => preparerScrutinAN(x.scrutin, x.crc))
      const r = await ecrireScrutins(lot)
      nouveaux += r.nouveaux
      maj += r.maj
      console.log(`    … ${Math.min(i + LOT, scrutins.length)}/${scrutins.length}`)
    }
  } else {
    const resultats = await enLots(aTraiter, CONCURRENCE, async (e) => {
      const s = await anFetchScrutin(e, head)
      return { s, crc: e.crc }
    })
    const prepares = resultats.filter((x) => x.s?.uid).map(({ s, crc }) => preparerScrutinAN(s, crc))
    for (let i = 0; i < prepares.length; i += LOT) {
      const r = await ecrireScrutins(prepares.slice(i, i + LOT))
      nouveaux += r.nouveaux
      maj += r.maj
    }
  }

  console.log(`  ✓ ${nouveaux} nouveaux, ${maj} mis à jour`)
  return { nouveaux, maj }
}

// ---------------------------------------------------------------------- Sénat

async function syncSenat() {
  console.log('\n▸ Sénat')
  let nouveaux = 0
  let maj = 0

  // Le Sénat ne publie que le libellé du département ; on récupère le code
  // depuis le référentiel de l'Assemblée pour un sélecteur « mes élus » unifié.
  const codesDepartement = new Map<string, string>()
  for (const r of await prisma.elu.findMany({
    where: { chambre: 'AN', numDepartement: { not: null }, departement: { not: null } },
    select: { departement: true, numDepartement: true },
    distinct: ['numDepartement'],
  })) {
    codesDepartement.set(cleDepartement(r.departement!), r.numDepartement!)
  }

  const ref = await senatReferentiel(FORCE, codesDepartement)
  await upsertGroupes(ref.groupes, 'SENAT', null)
  await upsertElus(ref.elus, 'SENAT', null)
  const nbApp = await replaceAppartenances(ref.appartenances, 'SENAT')
  const actifs = ref.elus.filter((e) => e.actif).length
  console.log(`  référentiel : ${ref.groupes.length} groupes, ${ref.elus.length} sénateurs (${actifs} actifs), ${nbApp} appartenances`)

  // Résolution du groupe d'un sénateur à la date d'un scrutin.
  const appart = await prisma.appartenanceGroupe.findMany({
    where: { elu: { chambre: 'SENAT' } },
    select: { eluId: true, groupeId: true, dateDebut: true, dateFin: true },
  })
  const parElu = new Map<string, typeof appart>()
  for (const a of appart) {
    const arr = parElu.get(a.eluId) ?? []
    arr.push(a)
    parElu.set(a.eluId, arr)
  }
  const groupeCourant = new Map(
    (await prisma.elu.findMany({ where: { chambre: 'SENAT' }, select: { id: true, groupeId: true } })).map(
      (e) => [e.id, e.groupeId],
    ),
  )
  const groupeAuDate = (eluId: string, date: Date): string | null => {
    for (const a of parElu.get(eluId) ?? []) {
      const apres = !a.dateDebut || a.dateDebut <= date
      const avant = !a.dateFin || a.dateFin >= date
      if (apres && avant) return a.groupeId
    }
    return groupeCourant.get(eluId) ?? null
  }

  const sessions = process.env.SENAT_SESSIONS
    ? process.env.SENAT_SESSIONS.split(',').map((s) => Number.parseInt(s.trim(), 10))
    : [senatSessionCourante()]

  for (const session of sessions) {
    const liste = await senatListeSession(session)
    const enBase = new Set(
      (
        await prisma.scrutin.findMany({
          where: { chambre: 'SENAT', session: `${session}-${session + 1}` },
          select: { id: true },
        })
      ).map((s) => s.id),
    )
    let aTraiter = FULL ? liste : liste.filter((m) => !enBase.has(`SEN-${session}-${m.numero}`))
    aTraiter.sort((a, b) => b.numero - a.numero)
    if (MAX > 0) aTraiter = aTraiter.slice(0, MAX)
    console.log(`  session ${session}-${session + 1} : ${liste.length} publiés, ${enBase.size} en base, ${aTraiter.length} à traiter`)

    const lots = await enLots(aTraiter, CONCURRENCE, async (m) => ({ m, res: await senatVotes(session, m.numero) }))
    const prepares = []
    for (const { m, res } of lots) {
      if (!res || !res.votes.length) {
        console.warn(`    ⚠ scrutin ${session}-${m.numero} : aucun vote récupéré, ignoré`)
        continue
      }
      prepares.push(preparerScrutinSenat(session, m, res.votes, groupeAuDate, res.lastModified))
    }
    for (let i = 0; i < prepares.length; i += LOT) {
      const r = await ecrireScrutins(prepares.slice(i, i + LOT))
      nouveaux += r.nouveaux
      maj += r.maj
      console.log(`    … ${Math.min(i + LOT, prepares.length)}/${prepares.length}`)
    }
  }

  console.log(`  ✓ ${nouveaux} nouveaux, ${maj} mis à jour`)
  return { nouveaux, maj }
}

// ----------------------------------------------------------------------- main

export async function synchroniser() {
  const t0 = Date.now()
  const runId = await debuterRun('SYNC')
  let nouveaux = 0
  let maj = 0
  const messages: string[] = []
  try {
    if (!CHAMBRE || CHAMBRE === 'AN') {
      const r = await syncAN()
      nouveaux += r.nouveaux
      maj += r.maj
      messages.push(`AN +${r.nouveaux}/~${r.maj}`)
    }
    if (!CHAMBRE || CHAMBRE === 'SENAT') {
      const r = await syncSenat()
      nouveaux += r.nouveaux
      maj += r.maj
      messages.push(`Sénat +${r.nouveaux}/~${r.maj}`)
    }

    // Agrégats dérivés : toujours recalculés, ils dépendent de l'ensemble.
    await calculerPresence()
    await reindexerRecherche()

    await terminerRun(runId, { ok: true, nbNouveaux: nouveaux, nbMaj: maj, message: messages.join(' · ') })
    console.log(`\n✅ Synchronisation terminée en ${((Date.now() - t0) / 1000).toFixed(0)}s — ${messages.join(' · ')}`)
    return { ok: true, nouveaux, maj, message: messages.join(' · ') }
  } catch (err) {
    const e = err as Error
    await terminerRun(runId, { ok: false, nbNouveaux: nouveaux, nbMaj: maj, erreur: e.message })
    throw e
  }
}
