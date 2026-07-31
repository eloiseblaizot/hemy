/**
 * Source de données Sénat.
 *
 *  - RÉFÉRENTIEL : ODSEN_GENERAL.csv (sénateurs) + ODSEN_HISTOGROUPES.csv
 *    (appartenances datées, qui servent aussi de fenêtre de mandat).
 *    Fichiers en Windows-1252, avec des lignes de commentaire préfixées « % ».
 *    ODSEN_ELUSEN.csv n'est PAS utilisé : il est factuellement périmé
 *    (aucun mandat ouvert après 2023-09, 93 sénateurs siégeants absents).
 *
 *  - SCRUTINS : page liste de la session pour les métadonnées, puis un
 *    endpoint JSON par scrutin pour les votes nominatifs (19 Ko), avec repli
 *    sur le HTML. Le dump SQL dosleg (126 Mo) n'est plus utilisé : il est plus
 *    lourd et il a des trous (scrutins 125, 126, 130 absents).
 */
import { parse } from 'csv-parse/sync'
import { download, decodeLatin1 } from './net'
import { senatGroupeMeta } from '../../shared/groupes'

const ODSEN_GENERAL = 'https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv'
const ODSEN_HISTO = 'https://data.senat.fr/data/senateurs/ODSEN_HISTOGROUPES.csv'

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function parseCsv(buf: Buffer): Record<string, string>[] {
  return parse(decodeLatin1(buf), {
    columns: true,
    comment: '%',
    delimiter: ',',
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[]
}

function keyResolver(rows: Record<string, string>[]) {
  const keys = Object.keys(rows[0] ?? {})
  return (target: string) =>
    keys.find((k) => norm(k) === norm(target)) ?? keys.find((k) => norm(k).includes(norm(target)))
}

/** "2026-04-20 00:00:00.0" -> Date (date civile, minuit UTC). */
function toDateCivile(s: string | undefined): Date | null {
  if (!s || !s.trim()) return null
  const m = s.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`)
}

export interface SenElu {
  id: string
  civilite: string | null
  prenom: string
  nom: string
  dateNaissance: Date | null
  profession: string | null
  departement: string | null
  /** Code du département, résolu par `codesDepartement` (voir plus bas). */
  numDepartement: string | null
  photoUrl: string
  actif: boolean
  groupeId: string
  roleGroupe: string | null
}

/**
 * Clé de rapprochement d'un libellé de département.
 * Le Sénat ne publie que le libellé (« Hautes-Pyrénées ») ; le code vient du
 * référentiel de l'Assemblée, ce qui permet un sélecteur « mes élus » unifié.
 */
export function cleDepartement(libelle: string): string {
  return norm(libelle)
}
export interface SenGroupe {
  id: string
  code: string
  libelle: string
  couleur: string
  ordre: number
}
export interface SenAppartenance {
  eluId: string
  groupeId: string
  dateDebut: Date | null
  dateFin: Date | null
  fonction: string | null
}

export async function senatReferentiel(force = false, codesDepartement?: Map<string, string>) {
  const general = parseCsv(await download(ODSEN_GENERAL, { force }))
  const g = keyResolver(general)
  const cMat = g('Matricule')!
  const cQ = g('Qualité')
  const cNom = g('Nom usuel')!
  const cPrenom = g('Prénom usuel')!
  const cEtat = g('État')
  const cNaiss = g('Date naissance')
  const cGrp = g('Groupe politique')!
  const cCirco = g('Circonscription')
  const cProf = g('Description de la profession')
  const cRole = g('Fonction au Bureau du Sénat')

  const groupes = new Map<string, SenGroupe>()
  const elus: SenElu[] = []

  for (const r of general) {
    const mat = (r[cMat] || '').trim().toUpperCase()
    if (!mat) continue
    const circo = cCirco ? (r[cCirco] || '').trim() : ''
    const meta = senatGroupeMeta(r[cGrp])
    const gid = `SEN-${meta.code}`
    groupes.set(gid, { id: gid, code: meta.code, libelle: meta.libelle, couleur: meta.couleur, ordre: meta.ordre })
    elus.push({
      id: mat,
      civilite: cQ ? r[cQ] || null : null,
      prenom: (r[cPrenom] || '').trim(),
      nom: (r[cNom] || '').trim(),
      dateNaissance: cNaiss ? toDateCivile(r[cNaiss]) : null,
      profession: cProf ? r[cProf] || null : null,
      departement: circo || null,
      numDepartement: circo ? (codesDepartement?.get(cleDepartement(circo)) ?? null) : null,
      photoUrl: `https://www.senat.fr/senimg/${mat}.jpg`,
      actif: cEtat ? (r[cEtat] || '').trim().toUpperCase() === 'ACTIF' : true,
      groupeId: gid,
      roleGroupe: cRole ? r[cRole] || null : null,
    })
  }

  // Appartenances datées (= fenêtre de mandat au Sénat).
  const histo = parseCsv(await download(ODSEN_HISTO, { force }))
  const h = keyResolver(histo)
  const hMat = h('Matricule')!
  const hCode = h('Code du groupe politique')!
  const hDeb = h("Date de début d'appartenance")
  const hFin = h("Date de fin d'appartenance")
  const hFonc = h('Nom court fonction')

  const appartenances: SenAppartenance[] = []
  for (const r of histo) {
    const mat = (r[hMat] || '').trim().toUpperCase()
    if (!mat) continue
    const meta = senatGroupeMeta(r[hCode])
    const gid = `SEN-${meta.code}`
    if (!groupes.has(gid)) {
      groupes.set(gid, { id: gid, code: meta.code, libelle: meta.libelle, couleur: meta.couleur, ordre: meta.ordre })
    }
    appartenances.push({
      eluId: mat,
      groupeId: gid,
      dateDebut: hDeb ? toDateCivile(r[hDeb]) : null,
      dateFin: hFin ? toDateCivile(r[hFin]) : null,
      fonction: hFonc ? r[hFonc] || null : null,
    })
  }

  return { groupes: [...groupes.values()], elus, appartenances }
}

// ------------------------------------------------------------------ scrutins

const MOIS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
}

function txt(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface SenScrutinMeta {
  numero: number
  date: Date
  objet: string
  sortCode: string
  dossier: string | null
}

/** Liste des scrutins d'une session (1 requête, ~280 Ko). */
export async function senatListeSession(session: number): Promise<SenScrutinMeta[]> {
  const url = `https://www.senat.fr/scrutin-public/scr${session}.html`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`)
  const html = Buffer.from(await r.arrayBuffer()).toString('utf8')
  const anchor = html.indexOf('id="accordion-1"')
  const body = anchor >= 0 ? html.slice(anchor) : html

  const items: SenScrutinMeta[] = []
  let dateIso = ''
  const RE = /<div class="list-group-subtitle">([^<]+)<\/div>|<p class="my-2">([\s\S]*?)<\/p>/g
  for (const m of body.matchAll(RE)) {
    if (m[1] !== undefined) {
      const d = txt(m[1]).match(/(\d{1,2})\s+(\S+)\s+(\d{4})/)
      if (d) {
        const mois = MOIS[d[2].toLowerCase()]
        if (mois) dateIso = `${d[3]}-${String(mois).padStart(2, '0')}-${String(+d[1]).padStart(2, '0')}`
      }
      continue
    }
    const p = m[2]
    const num = p.match(new RegExp(`scr${session}-(\\d+)\\.html`))
    if (!num || !dateIso) continue
    const badge = p.match(/<span class="badge[^"]*">([^<]*)<\/span>/)
    const doss = p.match(/href="(\/dossier-legislatif\/[^"]+)"/)
    // Ordre du nettoyage important : lien du dossier, puis badge, puis « - . » résiduel.
    let objet = txt(p.replace(/<a href="\/dossier-legislatif[\s\S]*?<\/a>/g, '')).replace(
      /^Scrutin N°\d+\s*:\s*/i,
      '',
    )
    if (badge) objet = objet.replace(txt(badge[1]), '')
    objet = objet.replace(/\s*[-–]\s*\.?\s*$/, '').trim()
    items.push({
      numero: Number(num[1]),
      date: new Date(`${dateIso}T00:00:00.000Z`),
      objet,
      sortCode: /adopt/i.test(badge?.[1] ?? '') ? 'adopté' : 'rejeté',
      dossier: doss?.[1] ?? null,
    })
  }
  return items
}

const SEN_POS = { p: 'POUR', c: 'CONTRE', a: 'ABSTENTION', n: 'NON_VOTANT' } as const
export type SenPosition = (typeof SEN_POS)[keyof typeof SEN_POS]

export interface SenVote {
  eluId: string
  position: SenPosition
  siege: number | null
}

/**
 * Votes nominatifs d'un scrutin (~19 Ko). L'endpoint JSON n'est pas documenté
 * (déduit du composant <hemicycle-votes>) : repli automatique sur le HTML.
 */
export async function senatVotes(
  session: number,
  numero: number,
): Promise<{ votes: SenVote[]; lastModified: string | null } | null> {
  const jsonUrl = `https://www.senat.fr/scrutin-public/${session}/scr${session}-${numero}.json`
  const r = await fetch(jsonUrl)
  if (r.status === 404) return null
  if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
    const data = (await r.json()) as { votes?: { matricule: string; vote: string; siege?: number }[] }
    const votes: SenVote[] = (data.votes ?? [])
      .map((v) => ({
        eluId: (v.matricule || '').toUpperCase(),
        position: (SEN_POS as Record<string, SenPosition>)[v.vote],
        siege: typeof v.siege === 'number' ? v.siege : null,
      }))
      .filter((v) => v.eluId && v.position)
    if (votes.length) return { votes, lastModified: r.headers.get('last-modified') }
  }
  return senatVotesHtml(session, numero)
}

/** Repli : extraction depuis la page détail (accordéons 1..4 = pour/contre/abst/NPPV). */
async function senatVotesHtml(
  session: number,
  numero: number,
): Promise<{ votes: SenVote[]; lastModified: string | null } | null> {
  const url = `https://www.senat.fr/scrutin-public/${session}/scr${session}-${numero}.html`
  const r = await fetch(url)
  if (r.status === 404 || !r.ok) return null
  const html = Buffer.from(await r.arrayBuffer()).toString('utf8')
  // Attention : 493 sénateurs ont un matricule entièrement numérique.
  const MAT = /href="\/senateur\/[^"]*?([0-9]{5}[a-z0-9])\.html"/g
  const SECTIONS: Record<string, SenPosition> = {
    '1': 'POUR', '2': 'CONTRE', '3': 'ABSTENTION', '4': 'NON_VOTANT',
  }
  const votes: SenVote[] = []
  const seen = new Set<string>()
  for (const [sid, pos] of Object.entries(SECTIONS)) {
    const i = html.indexOf(`id="accordion-collapse-${sid}"`)
    if (i < 0) continue
    const j = html.indexOf(`id="accordion-collapse-${Number(sid) + 1}"`)
    const seg = html.slice(i, j > i ? j : html.length)
    for (const m of seg.matchAll(MAT)) {
      const id = m[1].toUpperCase()
      if (seen.has(id)) continue
      seen.add(id)
      votes.push({ eluId: id, position: pos, siege: null })
    }
  }
  return votes.length ? { votes, lastModified: r.headers.get('last-modified') } : null
}

/** Session parlementaire courante (elle s'ouvre en octobre). */
export function senatSessionCourante(now = new Date()): number {
  return now.getUTCMonth() + 1 >= 10 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
}
