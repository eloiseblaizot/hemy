// Couche de requêtes réutilisable (auto-importée par Nitro).
import { prisma } from './db'

const groupeSelect = { id: true, code: true, libelle: true, libelleAbrege: true, couleur: true, ordre: true, chambre: true }

export interface ScrutinListItem {
  id: string
  chambre: string
  numero: string
  date: Date
  titre: string
  sortCode: string
  pour: number
  contre: number
  abstentions: number
  nonVotants: number
  nombreVotants: number
}

export async function latestScrutins(opts: { chambre?: string; limit?: number; offset?: number } = {}) {
  return prisma.scrutin.findMany({
    where: opts.chambre ? { chambre: opts.chambre } : {},
    orderBy: [{ date: 'desc' }, { numero: 'desc' }],
    take: opts.limit ?? 20,
    skip: opts.offset ?? 0,
  })
}

export async function countScrutins(chambre?: string) {
  return prisma.scrutin.count({ where: chambre ? { chambre } : {} })
}

export async function scrutinDetail(id: string) {
  const scrutin = await prisma.scrutin.findUnique({ where: { id } })
  if (!scrutin) return null

  const [analyses, votes] = await Promise.all([
    prisma.scrutinGroupe.findMany({
      where: { scrutinId: id },
      include: { groupe: { select: groupeSelect } },
      orderBy: { groupe: { ordre: 'asc' } },
    }),
    prisma.voteNominatif.findMany({
      where: { scrutinId: id },
      select: {
        position: true,
        cause: true,
        parDelegation: true,
        elu: { select: { nom: true, prenom: true, slug: true, actif: true } },
        groupe: { select: { id: true, code: true, couleur: true, ordre: true, libelle: true } },
      },
    }),
  ])

  const groupes = analyses.map((a) => ({
    ...a.groupe,
    pour: a.pour,
    contre: a.contre,
    abstentions: a.abstentions,
    nonVotants: a.nonVotants,
    positionMajoritaire: a.positionMajoritaire,
    total: a.pour + a.contre + a.abstentions + a.nonVotants,
  }))

  const sieges = votes.map((v) => ({
    position: v.position,
    cause: v.cause,
    parDelegation: v.parDelegation,
    nom: v.elu?.nom ?? '',
    prenom: v.elu?.prenom ?? '',
    slug: v.elu?.slug ?? null,
    groupeId: v.groupe?.id ?? null,
    groupeCode: v.groupe?.code ?? null,
    groupeLibelle: v.groupe?.libelle ?? null,
    couleur: v.groupe?.couleur ?? '#9AA5B1',
    ordre: v.groupe?.ordre ?? 99,
  }))

  return { scrutin, groupes, sieges }
}

export async function eluBySlug(slug: string) {
  const elu = await prisma.elu.findUnique({ where: { slug }, include: { groupe: { select: groupeSelect } } })
  if (!elu) return null
  const [grouped, presence, distributions] = await Promise.all([
    prisma.voteNominatif.groupBy({
      by: ['position'],
      where: { eluId: elu.id },
      _count: { _all: true },
    }),
    prisma.statPresence.findMany({ where: { eluId: elu.id } }),
    prisma.statDistribution.findMany({ where: { chambre: elu.chambre } }),
  ])
  const stats = { POUR: 0, CONTRE: 0, ABSTENTION: 0, NON_VOTANT: 0 }
  for (const g of grouped) (stats as any)[g.position] = g._count._all
  return {
    elu,
    stats,
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    presence: presence.sort((a) => (a.perimetre === 'SOLENNEL' ? -1 : 1)),
    distributions,
  }
}

/** Date de la dernière synchronisation réussie, par source. */
export async function fraicheur() {
  const runs = await prisma.$queryRaw<{ source: string; finishedAt: Date }[]>`
    SELECT DISTINCT ON (source) source, "finishedAt"
    FROM "IngestRun"
    WHERE ok = true AND "finishedAt" IS NOT NULL
    ORDER BY source, "finishedAt" DESC
  `
  const derniereMaj = runs.reduce<Date | null>(
    (acc, r) => (!acc || r.finishedAt > acc ? r.finishedAt : acc),
    null,
  )
  return { runs, derniereMaj }
}

export async function eluVotes(eluId: string, opts: { limit?: number; offset?: number; position?: string } = {}) {
  const where: any = { eluId }
  if (opts.position) where.position = opts.position
  const [rows, total] = await Promise.all([
    prisma.voteNominatif.findMany({
      where,
      take: opts.limit ?? 20,
      skip: opts.offset ?? 0,
      orderBy: { scrutin: { date: 'desc' } },
      select: {
        position: true,
        cause: true,
        parDelegation: true,
        scrutin: {
          select: { id: true, chambre: true, numero: true, date: true, titre: true, sortCode: true },
        },
      },
    }),
    prisma.voteNominatif.count({ where }),
  ])
  return { votes: rows, total }
}

export async function groupeDetail(id: string) {
  const groupe = await prisma.groupe.findUnique({ where: { id } })
  if (!groupe) return null
  const membres = await prisma.elu.findMany({
    where: { groupeId: id, actif: true },
    select: { id: true, slug: true, prenom: true, nom: true, departement: true, numDepartement: true, roleGroupe: true, photoUrl: true },
    orderBy: [{ nom: 'asc' }],
  })
  return { groupe, membres, nbMembres: membres.length }
}

export async function chambreOverview(chambre: string) {
  const [groupes, scrutins, total] = await Promise.all([
    prisma.groupe.findMany({
      where: { chambre, elus: { some: { actif: true } } },
      select: { ...groupeSelect, _count: { select: { elus: { where: { actif: true } } } } },
      orderBy: { ordre: 'asc' },
    }),
    latestScrutins({ chambre, limit: 15 }),
    countScrutins(chambre),
  ])
  return {
    groupes: groupes.map((g) => ({ ...g, nbMembres: g._count.elus })),
    scrutins,
    totalScrutins: total,
  }
}

/**
 * Recherche unifiée (scrutins, élus, groupes).
 * Combine le plein-texte français désaccentué (tsvector + GIN) et les
 * trigrammes, qui rattrapent les fautes de frappe et les préfixes.
 */
export async function searchAll(q: string, limit = 20) {
  const term = q.normalize('NFC').trim()
  if (term.length < 2) return []
  try {
    return await prisma.$queryRaw<
      { type: string; ref: string; chambre: string; label: string; sub: string; actif: boolean }[]
    >`
      WITH tq AS (
        SELECT websearch_to_tsquery('public.fr_unaccent', ${term}) AS q,
               lower(public.immutable_unaccent(${term}))           AS n
      )
      SELECT s.type, s.ref, s.chambre, s.label, s.sub, s.actif
      FROM public.search_index s, tq
      WHERE s.document @@ tq.q OR s.label_norm %> tq.n
      ORDER BY (
                 ts_rank_cd(s.document, tq.q) * 4
                 + similarity(s.label_norm, tq.n)
                 -- les élus en exercice passent devant les anciens
                 + CASE WHEN s.actif THEN 0.5 ELSE 0 END
               ) DESC,
               s.type, s.label
      LIMIT ${limit}
    `
  } catch (err) {
    console.error('[search]', (err as Error).message)
    return []
  }
}

export async function departements() {
  const rows = await prisma.elu.groupBy({
    by: ['numDepartement', 'departement', 'chambre'],
    where: { actif: true, numDepartement: { not: null } },
    _count: { _all: true },
  })
  const map = new Map<string, { code: string; nom: string; an: number; senat: number }>()
  for (const r of rows) {
    const code = r.numDepartement!
    const e = map.get(code) ?? { code, nom: r.departement ?? code, an: 0, senat: 0 }
    if (r.chambre === 'AN') e.an += r._count._all
    else e.senat += r._count._all
    if (r.departement) e.nom = r.departement
    map.set(code, e)
  }
  return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function elusByDepartement(code: string) {
  return prisma.elu.findMany({
    where: { numDepartement: code, actif: true },
    include: { groupe: { select: groupeSelect } },
    orderBy: [{ chambre: 'asc' }, { numCirco: 'asc' }, { nom: 'asc' }],
  })
}

export async function elusByIds(ids: string[]) {
  if (!ids.length) return []
  return prisma.elu.findMany({
    where: { id: { in: ids } },
    include: { groupe: { select: groupeSelect } },
    orderBy: [{ chambre: 'asc' }, { nom: 'asc' }],
  })
}
