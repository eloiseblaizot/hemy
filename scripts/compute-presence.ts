/**
 * Calcul de l'indicateur « votes en personne » (Assemblée nationale seulement).
 *
 * Formule :
 *   taux = votes personnels / (scrutins du mandat − scrutins non votables)
 *
 *   • votes personnels  = POUR / CONTRE / ABSTENTION exprimés soi-même.
 *     Les votes par délégation sont EXCLUS : l'ordonnance du 7/11/1958 ne les
 *     autorise qu'en cas d'empêchement, donc d'absence. (L'Assemblée, elle, les
 *     compte comme de la participation à son article 159 — d'où la mise en
 *     garde affichée dans l'interface.)
 *   • scrutins du mandat = fenêtre issue des mandats de GROUPE (AppartenanceGroupe),
 *     seule fenêtre auto-cohérente : les mandats ASSEMBLEE recopient leur date de
 *     début lors d'une reprise de mandat et gonflent le dénominateur jusqu'à ×7.
 *   • scrutins non votables = ceux où le député est non-votant institutionnel
 *     (présidence de l'Assemblée, présidence de séance, membre du Gouvernement).
 *     Ils sont NEUTRALISÉS (retirés du dénominateur), jamais comptés comme
 *     absence ni comme participation.
 *
 * Deux périmètres : SOLENNEL (scrutins solennels + motions de censure, celui
 * que l'Assemblée retient elle-même) et TOUS.
 *
 * AUCUN indicateur n'est calculé pour le SÉNAT : une position y est enregistrée
 * pour les 348 sénateurs à chaque scrutin, présents ou non (un seul membre du
 * groupe dépose les bulletins de ses collègues). La donnée de présence n'existe
 * tout simplement pas.
 */
import { prisma } from './lib/prisma'

/** Dénominateur minimal en dessous duquel un pourcentage n'a pas de sens. */
const SEUIL = { SOLENNEL: 10, TOUS: 200 } as const
/** Au-delà, l'élu exerce une fonction qui l'empêche de voter : pas d'indicateur. */
const PART_NEUTRALISEE_MAX = 0.3

const PERIMETRES = [
  { nom: 'SOLENNEL' as const, filtreSql: `s."typeVoteCode" IN ('SPS','MOC')` },
  { nom: 'TOUS' as const, filtreSql: `TRUE` },
]

interface Compte {
  eligibles: number
  neutralises: number
  personnels: number
  delegations: number
}

export async function calculerPresence() {
  console.log('\n▸ Votes en personne (Assemblée nationale)')

  const lignes: {
    eluId: string
    perimetre: string
    eligibles: number
    neutralises: number
    personnels: number
    delegations: number
    taux: number | null
    applicable: boolean
    motif: string | null
  }[] = []

  for (const p of PERIMETRES) {
    const comptes = new Map<string, Compte>()

    // Dénominateur : scrutins tenus pendant la fenêtre de mandat.
    // count(DISTINCT) absorbe les chevauchements d'intervalles.
    const eligibles = await prisma.$queryRawUnsafe<{ eluId: string; n: bigint }[]>(`
      SELECT a."eluId" AS "eluId", count(DISTINCT s.id) AS n
      FROM "AppartenanceGroupe" a
      JOIN "Elu" e ON e.id = a."eluId" AND e.chambre = 'AN'
      JOIN "Scrutin" s
        ON s.chambre = 'AN'
       AND (a."dateDebut" IS NULL OR s.date >= a."dateDebut")
       AND (a."dateFin"   IS NULL OR s.date <= a."dateFin")
       AND ${p.filtreSql}
      GROUP BY a."eluId"
    `)
    for (const r of eligibles) {
      comptes.set(r.eluId, { eligibles: Number(r.n), neutralises: 0, personnels: 0, delegations: 0 })
    }

    // Numérateur et neutralisations.
    const votes = await prisma.$queryRawUnsafe<
      { eluId: string; personnels: bigint; neutralises: bigint; delegations: bigint }[]
    >(`
      SELECT v."eluId" AS "eluId",
             count(*) FILTER (WHERE v.position <> 'NON_VOTANT' AND v."parDelegation" = false) AS personnels,
             count(*) FILTER (WHERE v.position  = 'NON_VOTANT')                              AS neutralises,
             count(*) FILTER (WHERE v."parDelegation" = true)                                AS delegations
      FROM "VoteNominatif" v
      JOIN "Scrutin" s ON s.id = v."scrutinId" AND s.chambre = 'AN' AND ${p.filtreSql}
      GROUP BY v."eluId"
    `)
    for (const r of votes) {
      const c = comptes.get(r.eluId) ?? { eligibles: 0, neutralises: 0, personnels: 0, delegations: 0 }
      c.personnels = Number(r.personnels)
      c.neutralises = Number(r.neutralises)
      c.delegations = Number(r.delegations)
      // Un vote enregistré hors fenêtre calculée ne doit jamais produire > 100 %.
      c.eligibles = Math.max(c.eligibles, c.personnels + c.neutralises)
      comptes.set(r.eluId, c)
    }

    for (const [eluId, c] of comptes) {
      const denominateur = c.eligibles - c.neutralises
      let applicable = true
      let motif: string | null = null
      let taux: number | null = null

      if (c.eligibles > 0 && c.neutralises / c.eligibles > PART_NEUTRALISEE_MAX) {
        applicable = false
        motif = 'fonction-institutionnelle'
      } else if (denominateur < SEUIL[p.nom]) {
        applicable = false
        motif = 'trop-peu-de-scrutins'
      } else {
        taux = Math.round((c.personnels / denominateur) * 1000) / 10
      }

      lignes.push({
        eluId,
        perimetre: p.nom,
        eligibles: c.eligibles,
        neutralises: c.neutralises,
        personnels: c.personnels,
        delegations: c.delegations,
        taux,
        applicable,
        motif,
      })
    }
  }

  // Écriture (remplacement complet : ces valeurs sont entièrement dérivées).
  await prisma.statPresence.deleteMany({})
  for (let i = 0; i < lignes.length; i += 2000) {
    await prisma.statPresence.createMany({ data: lignes.slice(i, i + 2000) })
  }

  // Repères de distribution, pour situer un élu sans publier de classement.
  await prisma.statDistribution.deleteMany({})
  for (const p of PERIMETRES) {
    const taux = lignes
      .filter((l) => l.perimetre === p.nom && l.applicable && l.taux !== null)
      .map((l) => l.taux as number)
      .sort((a, b) => a - b)
    if (taux.length < 10) continue
    const q = (f: number) => taux[Math.min(taux.length - 1, Math.floor(f * (taux.length - 1)))]
    await prisma.statDistribution.create({
      data: {
        chambre: 'AN',
        perimetre: p.nom,
        nbElus: taux.length,
        mediane: q(0.5),
        p10: q(0.1),
        p90: q(0.9),
      },
    })
    console.log(
      `  ${p.nom.padEnd(9)} ${taux.length} députés — médiane ${q(0.5).toFixed(1)} % (p10 ${q(0.1).toFixed(1)} %, p90 ${q(0.9).toFixed(1)} %)`,
    )
  }

  const nonApplicables = lignes.filter((l) => !l.applicable).length
  console.log(`  ✓ ${lignes.length} lignes calculées (${nonApplicables} indicateurs non applicables)`)
}
