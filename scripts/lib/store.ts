/** Écritures en base, partagées par l'AN et le Sénat. Toutes idempotentes. */
import { prisma } from './prisma'
import { makeUniqueSlug, xmlText, toArray, toInt, toDate, str } from './text'
import type { PositionVote } from '../../generated/prisma/enums'

export const CHUNK = 4000 // < 65535/6 paramètres de bind par requête

export async function chunked<T>(rows: T[], fn: (part: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += CHUNK) await fn(rows.slice(i, i + CHUNK))
}

// Caches de session : ces ensembles sont consultés une fois par scrutin, il
// serait absurde de les relire en base des milliers de fois.
let cacheGroupes: Set<string> | null = null
let cacheElus: Set<string> | null = null

async function groupesConnus(): Promise<Set<string>> {
  if (!cacheGroupes) {
    cacheGroupes = new Set((await prisma.groupe.findMany({ select: { id: true } })).map((g) => g.id))
  }
  return cacheGroupes
}

async function elusConnus(): Promise<Set<string>> {
  if (!cacheElus) {
    cacheElus = new Set((await prisma.elu.findMany({ select: { id: true } })).map((e) => e.id))
  }
  return cacheElus
}

/** À appeler après avoir modifié les référentiels. */
export function inviderCaches() {
  cacheGroupes = null
  cacheElus = null
}

// ------------------------------------------------------------- référentiels

export async function upsertGroupes(
  groupes: { id: string; code: string; libelle: string; libelleAbrege?: string | null; couleur: string; ordre: number }[],
  chambre: string,
  legislature: string | null,
) {
  for (const g of groupes) {
    const data = {
      chambre,
      code: g.code,
      libelle: g.libelle,
      libelleAbrege: g.libelleAbrege ?? null,
      couleur: g.couleur,
      ordre: g.ordre,
      legislature,
    }
    await prisma.groupe.upsert({ where: { id: g.id }, create: { id: g.id, ...data }, update: data })
  }
  inviderCaches()
}

export interface EluInput {
  id: string
  civilite?: string | null
  prenom: string
  nom: string
  dateNaissance?: Date | null
  profession?: string | null
  region?: string | null
  departement?: string | null
  numDepartement?: string | null
  numCirco?: string | null
  photoUrl?: string | null
  actif: boolean
  groupeId?: string | null
  roleGroupe?: string | null
}

/** Upsert des élus, avec des slugs stables (jamais réattribués). */
export async function upsertElus(elus: EluInput[], chambre: string, legislature: string | null) {
  const existing = await prisma.elu.findMany({ select: { id: true, slug: true } })
  const used = new Set(existing.map((e) => e.slug))
  const slugById = new Map(existing.map((e) => [e.id, e.slug]))
  const groupeIds = new Set((await prisma.groupe.findMany({ select: { id: true } })).map((g) => g.id))

  for (const e of elus) {
    const slug = slugById.get(e.id) ?? makeUniqueSlug(`${e.prenom} ${e.nom}`, used, e.id)
    const data = {
      chambre,
      civilite: e.civilite ?? null,
      prenom: e.prenom,
      nom: e.nom,
      slug,
      dateNaissance: e.dateNaissance ?? null,
      profession: e.profession ?? null,
      region: e.region ?? null,
      departement: e.departement ?? null,
      numDepartement: e.numDepartement ?? null,
      numCirco: e.numCirco ?? null,
      photoUrl: e.photoUrl ?? null,
      actif: e.actif,
      legislature,
      groupeId: e.groupeId && groupeIds.has(e.groupeId) ? e.groupeId : null,
      roleGroupe: e.roleGroupe ?? null,
    }
    await prisma.elu.upsert({ where: { id: e.id }, create: { id: e.id, ...data }, update: data })
  }
  inviderCaches()
}

export async function replaceAppartenances(
  app: { eluId: string; groupeId: string; dateDebut: Date | null; dateFin: Date | null; fonction: string | null }[],
  chambre: string,
) {
  const eluIds = (await prisma.elu.findMany({ where: { chambre }, select: { id: true } })).map((e) => e.id)
  const known = new Set(eluIds)
  const groupeIds = new Set(
    (await prisma.groupe.findMany({ where: { chambre }, select: { id: true } })).map((g) => g.id),
  )
  await prisma.appartenanceGroupe.deleteMany({ where: { eluId: { in: eluIds } } })
  const rows = app.filter((a) => known.has(a.eluId) && groupeIds.has(a.groupeId))
  await chunked(rows, (part) => prisma.appartenanceGroupe.createMany({ data: part }))
  return rows.length
}

/** Crée les élus référencés par un scrutin mais absents du référentiel. */
export async function ensureElusFantomes(ids: string[], chambre: string, groupeId: string | null) {
  if (!ids.length) return 0
  const known = await elusConnus()
  const manquants = ids.filter((id) => !known.has(id))
  for (const id of manquants) {
    const label = chambre === 'AN' ? '(Ancien député)' : '(Ancien sénateur)'
    await prisma.elu.upsert({
      where: { id },
      create: {
        id,
        chambre,
        prenom: '',
        nom: label,
        slug: `${chambre.toLowerCase()}-${id.toLowerCase()}`,
        actif: false,
        groupeId,
      },
      update: {},
    })
    known.add(id)
  }
  return manquants.length
}

// ---------------------------------------------------------------- scrutins AN

const AN_CATEGORIES: [string, PositionVote][] = [
  ['pours', 'POUR'],
  ['contres', 'CONTRE'],
  ['abstentions', 'ABSTENTION'],
  ['nonVotants', 'NON_VOTANT'],
]

export interface ScrutinEcrit {
  id: string
  cree: boolean
  votes: number
}

/**
 * Écrit un scrutin de l'AN (objet `scrutin` de l'open data).
 * Pièges gérés : `votant` tantôt objet tantôt tableau, catégories à null,
 * valeurs numériques en texte, position déduite de la clé parente, doublons.
 */
export async function upsertScrutinAN(s: any, checksum: string | null): Promise<ScrutinEcrit> {
  const synth = s.syntheseVote ?? {}
  const d = synth.decompte ?? {}
  const numero = String(s.numero ?? '')
  const data = {
    chambre: 'AN',
    numero,
    numeroInt: Number.parseInt(numero, 10) || 0,
    legislature: String(s.legislature ?? '17'),
    session: str(s.sessionRef),
    date: toDate(s.dateScrutin) ?? new Date(0),
    titre: str(s.titre) ?? str(s.objet?.libelle) ?? 'Scrutin',
    objet: str(s.objet?.libelle),
    demandeur: str(s.demandeur?.texte),
    typeVoteCode: str(s.typeVote?.codeTypeVote),
    typeVoteLibelle: str(s.typeVote?.libelleTypeVote),
    sortCode: str(s.sort?.code) ?? '',
    sortLibelle: str(s.sort?.libelle),
    nombreVotants: toInt(synth.nombreVotants),
    suffragesExprimes: toInt(synth.suffragesExprimes),
    nbrSuffragesRequis: toInt(synth.nbrSuffragesRequis),
    pour: toInt(d.pour),
    contre: toInt(d.contre),
    abstentions: toInt(d.abstentions),
    nonVotants: toInt(d.nonVotants) + toInt(d.nonVotantsVolontaires),
    sourceChecksum: checksum,
    majAt: new Date(),
  }

  const analyses = new Map<string, any>()
  const votes = new Map<string, any>()

  for (const g of toArray<any>(s.ventilationVotes?.organe?.groupes?.groupe)) {
    const groupeId = xmlText(g.organeRef)
    if (!groupeId) continue
    if (!analyses.has(groupeId)) {
      const dv = g.vote?.decompteVoix ?? {}
      analyses.set(groupeId, {
        scrutinId: s.uid,
        groupeId,
        nombreMembres: toInt(g.nombreMembresGroupe),
        positionMajoritaire: g.vote?.positionMajoritaire ?? null,
        pour: toInt(dv.pour),
        contre: toInt(dv.contre),
        abstentions: toInt(dv.abstentions),
        nonVotants: toInt(dv.nonVotants) + toInt(dv.nonVotantsVolontaires),
      })
    }
    const dn = g.vote?.decompteNominatif ?? {}
    for (const [key, position] of AN_CATEGORIES) {
      const cat = dn[key]
      if (!cat) continue
      for (const v of toArray<any>(cat.votant)) {
        const eluId = xmlText(v.acteurRef)
        if (!eluId || votes.has(eluId)) continue
        votes.set(eluId, {
          scrutinId: s.uid,
          eluId,
          groupeId,
          position,
          parDelegation: v.parDelegation === 'true',
          cause: v.causePositionVote ?? null,
        })
      }
    }
  }

  const existait = await prisma.scrutin.findUnique({ where: { id: s.uid }, select: { id: true } })
  await prisma.scrutin.upsert({ where: { id: s.uid }, create: { id: s.uid, ...data }, update: data })
  await ensureElusFantomes([...votes.keys()], 'AN', null)
  await ecrireDetail(s.uid, [...analyses.values()], [...votes.values()])
  return { id: s.uid, cree: !existait, votes: votes.size }
}

// ------------------------------------------------------------- scrutins Sénat

export async function upsertScrutinSenat(
  session: number,
  meta: { numero: number; date: Date; objet: string; sortCode: string },
  votes: { eluId: string; position: PositionVote }[],
  groupeAuDate: (eluId: string, date: Date) => string | null,
  checksum: string | null,
): Promise<ScrutinEcrit> {
  const id = `SEN-${session}-${meta.numero}`
  const compte = { POUR: 0, CONTRE: 0, ABSTENTION: 0, NON_VOTANT: 0 }
  const parGroupe = new Map<string, { pour: number; contre: number; abstentions: number; nonVotants: number }>()
  const rows = new Map<string, any>()

  for (const v of votes) {
    if (rows.has(v.eluId)) continue
    compte[v.position]++
    const groupeId = groupeAuDate(v.eluId, meta.date)
    rows.set(v.eluId, {
      scrutinId: id,
      eluId: v.eluId,
      groupeId,
      position: v.position,
      parDelegation: false,
      cause: null,
    })
    if (groupeId) {
      const gc = parGroupe.get(groupeId) ?? { pour: 0, contre: 0, abstentions: 0, nonVotants: 0 }
      if (v.position === 'POUR') gc.pour++
      else if (v.position === 'CONTRE') gc.contre++
      else if (v.position === 'ABSTENTION') gc.abstentions++
      else gc.nonVotants++
      parGroupe.set(groupeId, gc)
    }
  }

  const exprimes = compte.POUR + compte.CONTRE
  const data = {
    chambre: 'SENAT',
    numero: String(meta.numero),
    numeroInt: meta.numero,
    legislature: null,
    session: `${session}-${session + 1}`,
    date: meta.date,
    titre: meta.objet || `Scrutin n°${meta.numero}`,
    objet: meta.objet || null,
    demandeur: null,
    typeVoteCode: null,
    typeVoteLibelle: null,
    sortCode: meta.sortCode,
    sortLibelle: meta.sortCode === 'adopté' ? 'Le Sénat a adopté' : "Le Sénat n'a pas adopté",
    nombreVotants: compte.POUR + compte.CONTRE + compte.ABSTENTION,
    suffragesExprimes: exprimes,
    nbrSuffragesRequis: Math.floor(exprimes / 2) + 1,
    pour: compte.POUR,
    contre: compte.CONTRE,
    abstentions: compte.ABSTENTION,
    nonVotants: compte.NON_VOTANT,
    sourceChecksum: checksum,
    majAt: new Date(),
  }

  const analyses = [...parGroupe.entries()].map(([groupeId, gc]) => ({
    scrutinId: id,
    groupeId,
    nombreMembres: null,
    positionMajoritaire:
      gc.pour >= gc.contre && gc.pour >= gc.abstentions
        ? 'pour'
        : gc.contre >= gc.abstentions
          ? 'contre'
          : 'abstention',
    ...gc,
  }))

  const existait = await prisma.scrutin.findUnique({ where: { id }, select: { id: true } })
  await prisma.scrutin.upsert({ where: { id }, create: { id, ...data }, update: data })
  await ensureElusFantomes([...rows.keys()], 'SENAT', null)
  await ecrireDetail(id, analyses, [...rows.values()])
  return { id, cree: !existait, votes: rows.size }
}

/** Remplace le détail d'un scrutin (analyses + votes) : rejouable à l'identique. */
async function ecrireDetail(scrutinId: string, analyses: any[], votes: any[]) {
  const groupeIds = await groupesConnus()
  await prisma.scrutinGroupe.deleteMany({ where: { scrutinId } })
  await prisma.voteNominatif.deleteMany({ where: { scrutinId } })
  const a = analyses.filter((x) => groupeIds.has(x.groupeId))
  if (a.length) await prisma.scrutinGroupe.createMany({ data: a })
  const v = votes.map((x) => (x.groupeId && groupeIds.has(x.groupeId) ? x : { ...x, groupeId: null }))
  await chunked(v, (part) => prisma.voteNominatif.createMany({ data: part }))
}

// --------------------------------------------------------------- journalisation

export async function debuterRun(source: string) {
  const run = await prisma.ingestRun.create({ data: { source } })
  return run.id
}

export async function terminerRun(
  id: number,
  res: { ok: boolean; nbNouveaux?: number; nbMaj?: number; message?: string; erreur?: string },
) {
  await prisma.ingestRun.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      ok: res.ok,
      nbNouveaux: res.nbNouveaux ?? 0,
      nbMaj: res.nbMaj ?? 0,
      message: res.message ?? null,
      erreur: res.erreur ?? null,
    },
  })
}

/** Verrou anti-concurrence : Vercel peut invoquer deux fois le même cron. */
export async function synchronisationEnCours(minutes = 20): Promise<boolean> {
  const depuis = new Date(Date.now() - minutes * 60_000)
  const n = await prisma.ingestRun.count({
    where: { source: 'SYNC', finishedAt: null, startedAt: { gt: depuis } },
  })
  return n > 0
}
