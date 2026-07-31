// Métadonnées de groupes politiques utilisées à l'ingestion.
//
// - AN : les couleurs viennent des données officielles (couleurAssociee).
//   Seul l'ORDRE gauche->droite manque (positionPolitique null pour la 17e
//   législature) : on le fournit ici, indexé par libellé abrégé.
// - Sénat : ni couleur ni ordre ne sont publiés. On mappe les libellés/codes
//   observés (ODSEN_GENERAL ET dump dosleg) vers { code, libellé, couleur, ordre }.

/** Ordre visuel gauche -> droite des groupes de l'Assemblée (17e législature). */
export const AN_ORDRE_GROUPE: Record<string, number> = {
  'LFI-NFP': 1,
  GDR: 2,
  EcoS: 3,
  SOC: 4,
  LIOT: 5,
  Dem: 6,
  EPR: 7,
  HOR: 8,
  DR: 9,
  UDR: 10,
  RN: 11,
  NI: 12,
}

export function anOrdreGroupe(codeAbrege: string | null | undefined): number {
  if (!codeAbrege) return 99
  return AN_ORDRE_GROUPE[codeAbrege] ?? 90
}

export interface SenatGroupeMeta {
  code: string
  libelle: string
  couleur: string
  ordre: number
}

function normCode(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

// Groupes canoniques du Sénat (couleurs conventionnelles, aucune officielle publiée).
const SENAT_CANON: Record<string, SenatGroupeMeta> = {
  CRCE: { code: 'CRCE', libelle: 'Communiste Républicain Citoyen et Écologiste - Kanaky', couleur: '#B01313', ordre: 1 },
  GEST: { code: 'GEST', libelle: 'Écologiste - Solidarité et Territoires', couleur: '#4E9A51', ordre: 2 },
  SER: { code: 'SER', libelle: 'Socialiste, Écologiste et Républicain', couleur: '#E4526A', ordre: 3 },
  RDSE: { code: 'RDSE', libelle: 'Rassemblement Démocratique et Social Européen', couleur: '#C9A227', ordre: 4 },
  RDPI: { code: 'RDPI', libelle: 'Rassemblement des Démocrates, Progressistes et Indépendants', couleur: '#F19E39', ordre: 5 },
  UC: { code: 'UC', libelle: 'Union Centriste', couleur: '#3B6FB0', ordre: 6 },
  LIRT: { code: 'LIRT', libelle: 'Les Indépendants - République et Territoires', couleur: '#8AB0D9', ordre: 7 },
  LR: { code: 'LR', libelle: 'Les Républicains', couleur: '#12386E', ordre: 8 },
  NI: { code: 'NI', libelle: 'Non inscrits', couleur: '#9AA5B1', ordre: 12 },
  NR: { code: 'NR', libelle: 'Non rattachés', couleur: '#B8C1CC', ordre: 13 },
}

// Alias (normalisés) -> clé canonique. Couvre ODSEN_GENERAL (actuel) et le
// dump dosleg / HISTOGROUPES (codes historiques).
const SENAT_ALIAS: Record<string, keyof typeof SENAT_CANON> = {
  // ODSEN_GENERAL (valeurs actuelles)
  lesrepublicains: 'LR',
  ser: 'SER',
  uc: 'UC',
  lesindependants: 'LIRT',
  rdpi: 'RDPI',
  crcek: 'CRCE',
  gest: 'GEST',
  rdse: 'RDSE',
  ni: 'NI',
  // Dosleg / HISTOGROUPES (codes historiques)
  ump: 'LR',
  soc: 'SER',
  crc: 'CRCE',
  crce: 'CRCE',
  eco: 'GEST',
  ri: 'LIRT',
  ind: 'LIRT',
  gd: 'NI',
  aucun: 'NR',
  // variantes plausibles
  unioncentriste: 'UC',
  socialisteecologisteetrepublicain: 'SER',
}

/** Résout un libellé/code de groupe Sénat vers des métadonnées, avec repli neutre. */
export function senatGroupeMeta(code: string | null | undefined): SenatGroupeMeta {
  const raw = (code ?? '').trim()
  const key = SENAT_ALIAS[normCode(raw)]
  if (key) return SENAT_CANON[key]
  return { code: raw || 'NI', libelle: raw || 'Non inscrits', couleur: '#9AA5B1', ordre: 11 }
}
