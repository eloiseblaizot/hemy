// Types partagés app <-> serveur (Nuxt 4 auto-importe shared/).

export type Chambre = 'AN' | 'SENAT'

export type Position = 'POUR' | 'CONTRE' | 'ABSTENTION' | 'NON_VOTANT'

export type SortCode = 'adopté' | 'rejeté'

/** Métadonnées d'affichage des positions de vote. */
export const POSITION_META: Record<
  Position,
  { label: string; labelCourt: string; couleur: string; couleurDouce: string; ordre: number }
> = {
  POUR: { label: 'Pour', labelCourt: 'Pour', couleur: 'var(--color-pour)', couleurDouce: 'var(--color-pour-soft)', ordre: 0 },
  CONTRE: { label: 'Contre', labelCourt: 'Contre', couleur: 'var(--color-contre)', couleurDouce: 'var(--color-contre-soft)', ordre: 1 },
  ABSTENTION: { label: 'Abstention', labelCourt: 'Abst.', couleur: 'var(--color-abstention)', couleurDouce: 'var(--color-abstention-soft)', ordre: 2 },
  NON_VOTANT: { label: 'N\'a pas pris part', labelCourt: 'N.V.', couleur: 'var(--color-nonvotant)', couleurDouce: 'var(--color-nonvotant-soft)', ordre: 3 },
}

export const POSITIONS: Position[] = ['POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT']

export const CHAMBRE_META: Record<Chambre, { label: string; labelCourt: string; total: number; slug: string }> = {
  AN: { label: 'Assemblée nationale', labelCourt: 'Assemblée', total: 577, slug: 'assemblee-nationale' },
  SENAT: { label: 'Sénat', labelCourt: 'Sénat', total: 348, slug: 'senat' },
}

/** Le mot désignant un membre selon la chambre. */
export function termeElu(chambre: Chambre, pluriel = false): string {
  if (chambre === 'AN') return pluriel ? 'députés' : 'député'
  return pluriel ? 'sénateurs' : 'sénateur'
}

/** Un « siège » tel qu'attendu par le composant Hémicycle (= sortie API). */
export interface Siege {
  position: Position
  cause?: string | null
  parDelegation?: boolean
  nom?: string
  prenom?: string
  slug?: string | null
  groupeId?: string | null
  groupeCode?: string | null
  groupeLibelle?: string | null
  couleur?: string
  ordre?: number
}

/** Décompte agrégé (par groupe ou global). */
export interface Decompte {
  pour: number
  contre: number
  abstentions: number
  nonVotants: number
}

export function totalDecompte(d: Decompte): number {
  return d.pour + d.contre + d.abstentions + d.nonVotants
}
