// Libellés et mises en garde de l'indicateur « votes en personne ».
//
// Vocabulaire volontairement contraint : jamais « absent », « absentéisme »,
// « assiduité » ni « taux de présence ». L'Assemblée ne publie aucun relevé de
// présence dans l'hémicycle ; ce que l'on mesure, ce sont les votes enregistrés.

import type { Position } from './types'

export const PERIMETRES = {
  SOLENNEL: {
    cle: 'SOLENNEL',
    titre: 'Scrutins solennels',
    description:
      'Votes solennels et motions de censure : programmés à l’avance, ce sont ceux que l’Assemblée retient elle-même (article 159 de son Règlement).',
  },
  TOUS: {
    cle: 'TOUS',
    titre: 'Tous les scrutins publics',
    description:
      'L’ensemble des scrutins publics, y compris les votes d’amendements très nombreux, souvent tenus pendant les réunions de commission.',
  },
} as const

export const MOTIFS: Record<string, string> = {
  'trop-peu-de-scrutins': 'Trop peu de scrutins pendant son mandat pour calculer un indicateur.',
  'fonction-institutionnelle':
    'Par sa fonction (présidence de l’Assemblée ou de séance, fonctions ministérielles), cet élu ne prend pas part aux votes. L’indicateur n’est pas applicable.',
}

/** Titre honnête de l'indicateur. */
export const TITRE_INDICATEUR = 'Votes en personne'

/** Mise en garde affichée (et non masquée derrière un lien discret). */
export const AVERTISSEMENTS: string[] = [
  'Ce chiffre n’est pas un taux de présence, et ce n’est pas une mesure du travail d’un député.',
  'L’Assemblée nationale ne publie aucun relevé de présence dans l’hémicycle : il y a un va-et-vient permanent en séance. La seule chose que l’on puisse compter, ce sont les votes effectivement enregistrés au nom du député lors des scrutins publics.',
  'La plupart des votes en séance se font à main levée et ne laissent aucune trace nominative : ils ne sont pas comptés ici.',
  'Un chiffre bas est normal. Les scrutins ont souvent lieu pendant les réunions de commission, les auditions, les missions ou le travail en circonscription — et les groupes ne font fréquemment voter que les députés spécialistes du texte discuté.',
  'Les votes émis par délégation ne sont pas comptés comme des votes en personne : la loi ne les autorise qu’en cas d’empêchement (ordonnance du 7 novembre 1958), donc d’absence. Ils sont affichés séparément. L’Assemblée, elle, les compte comme de la participation dans son propre calcul.',
  'Les scrutins où le député ne pouvait pas voter sont retirés du calcul : présidence de séance, présidence de l’Assemblée, fonctions ministérielles.',
  'Les absences justifiées ne sont pas distinguables : un congé maladie, un congé maternité ou une mission officielle font baisser ce chiffre comme une absence de convenance. Les motifs ne sont pas publiés.',
  'Ce chiffre ne dit rien de la présence en commission, des amendements déposés, des rapports rédigés, des questions posées ni du travail en circonscription.',
]

export const NOTE_SENAT = [
  'Au Sénat, une position de vote est enregistrée pour l’ensemble des 348 sénateurs à chaque scrutin public, qu’ils soient présents ou non : lors d’un scrutin ordinaire, un seul membre d’un groupe peut déposer les bulletins de tous ses collègues. Aucun sénateur n’est jamais « manquant » dans les données publiées.',
  'Les données ouvertes du Sénat ne permettent donc pas de calculer un taux de présence ou d’absence, et nous n’en publions pas. Les positions affichées sont celles enregistrées au nom du sénateur, qui reflètent le plus souvent la consigne de son groupe.',
]

export const MENTION_SANS_CLASSEMENT =
  'Nous ne publions volontairement aucun classement des élus : aucune pondération ne permettrait d’établir un palmarès juste.'

/** Libellé d'une position pour un scrutin donné, en évitant tout jugement. */
export function libellePosition(
  position: Position,
  cause?: string | null,
  parDelegation?: boolean,
): string {
  if (position === 'NON_VOTANT') {
    const precision: Record<string, string> = {
      PAN: ' (présidait l’Assemblée)',
      PSE: ' (présidait la séance)',
      MG: ' (membre du Gouvernement)',
      DEPORT: ' (déport)',
    }
    return `N’a pas pris part au vote${cause ? (precision[cause] ?? '') : ''}`
  }
  if (parDelegation) return 'Vote émis par délégation'
  if (position === 'POUR') return 'A voté pour'
  if (position === 'CONTRE') return 'A voté contre'
  return 'S’est abstenu'
}

/** Situe un taux dans la distribution, sans produire de rang. */
export function situer(taux: number, mediane: number, p10: number, p90: number): string {
  if (taux >= p90) return 'parmi les plus élevés des députés'
  if (taux <= p10) return 'parmi les plus bas des députés'
  if (taux >= mediane) return 'dans la moitié haute des députés'
  return 'dans la moitié basse des députés'
}
