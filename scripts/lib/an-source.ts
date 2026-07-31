/**
 * Source de données Assemblée nationale.
 *
 * Deux volets :
 *  - RÉFÉRENTIEL : AMO30 (historique complet de la législature). On l'utilise
 *    plutôt qu'AMO10 parce qu'AMO10 ignore les ex-députés et ne clôt jamais un
 *    mandat, ce qui rend toute fenêtre de mandat inexploitable.
 *  - SCRUTINS : lecture chirurgicale du zip par HTTP Range. Un zip est un
 *    conteneur à accès aléatoire : on lit l'EOCD (22 o) pour compter les
 *    entrées, le central directory (~590 Ko) pour le manifeste avec CRC32,
 *    puis ~5,4 Ko par scrutin réellement nouveau. Au lieu de 25 Mo par jour.
 */
import zlib from 'node:zlib'
import { download, unzip, rangeGet } from './net'
import { anOrdreGroupe } from '../../shared/groupes'
import { xmlText, isNil, toArray, toDate, str } from './text'

const BASE = 'https://data.assemblee-nationale.fr/static/openData/repository/17'
export const AN_SCRUTINS_ZIP = `${BASE}/loi/scrutins/Scrutins.json.zip`
const AMO30 = `${BASE}/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip`
export const AN_LEGISLATURE = '17'

const dec = new TextDecoder('utf-8')

// ---------------------------------------------------------------- référentiel

export interface AnGroupe {
  id: string
  code: string
  libelle: string
  libelleAbrege: string | null
  couleur: string
  ordre: number
}
export interface AnElu {
  id: string
  civilite: string | null
  prenom: string
  nom: string
  dateNaissance: Date | null
  profession: string | null
  region: string | null
  departement: string | null
  numDepartement: string | null
  numCirco: string | null
  photoUrl: string
  actif: boolean
  groupeId: string | null
  roleGroupe: string | null
}
export interface AnAppartenance {
  eluId: string
  groupeId: string
  dateDebut: Date | null
  dateFin: Date | null
  fonction: string | null
}

/** Parse AMO30 : groupes politiques, députés de la législature, mandats GP. */
export async function anReferentiel(force = false) {
  const buf = await download(AMO30, { filename: 'AMO30_17.json.zip', force })
  const files = unzip(buf)

  const groupes: AnGroupe[] = []
  const elus: AnElu[] = []
  const appartenances: AnAppartenance[] = []

  for (const [path, bytes] of Object.entries(files)) {
    if (path.includes('/organe/')) {
      const o = JSON.parse(dec.decode(bytes)).organe
      if (o?.codeType === 'GP' && String(o.legislature) === AN_LEGISLATURE) {
        const abrege = str(o.libelleAbrege)
        groupes.push({
          id: str(o.uid)!,
          code: abrege || str(o.libelleAbrev) || str(o.libelle) || '?',
          libelle: str(o.libelle) || abrege || '?',
          libelleAbrege: abrege,
          couleur: str(o.couleurAssociee) || '#9AA5B1',
          ordre: anOrdreGroupe(abrege),
        })
      }
      continue
    }
    if (!path.includes('/acteur/')) continue

    const a = JSON.parse(dec.decode(bytes)).acteur
    const uid = xmlText(a?.uid)
    if (!uid) continue

    const mandats = toArray<any>(a.mandats?.mandat).filter(
      (m) => String(m.legislature) === AN_LEGISLATURE,
    )
    const gpMandats = mandats.filter((m) => m.typeOrgane === 'GP')
    if (!gpMandats.length) continue // pas député de cette législature

    for (const m of gpMandats) {
      const gid = xmlText(m.organes?.organeRef)
      if (!gid) continue
      appartenances.push({
        eluId: uid,
        groupeId: gid,
        dateDebut: toDate(m.dateDebut),
        dateFin: isNil(m.dateFin) ? null : toDate(m.dateFin),
        fonction: m.infosQualite?.libQualite ?? null,
      })
    }

    // Situation courante : mandat GP ouvert, sinon le plus récent.
    const gpCourant =
      gpMandats.find((m) => isNil(m.dateFin)) ??
      [...gpMandats].sort((x, y) => String(y.dateFin ?? '').localeCompare(String(x.dateFin ?? '')))[0]
    const actif = gpMandats.some((m) => isNil(m.dateFin))

    const asmOuvert = mandats.find((m) => m.typeOrgane === 'ASSEMBLEE' && isNil(m.dateFin))
    const asmDernier =
      asmOuvert ??
      mandats
        .filter((m) => m.typeOrgane === 'ASSEMBLEE')
        .sort((x, y) => String(y.dateFin ?? '').localeCompare(String(x.dateFin ?? '')))[0]
    const lieu = asmDernier?.election?.lieu ?? {}

    const ident = a.etatCivil?.ident ?? {}
    elus.push({
      id: uid,
      civilite: str(ident.civ),
      prenom: str(ident.prenom) ?? '',
      nom: str(ident.nom) ?? '',
      dateNaissance: toDate(a.etatCivil?.infoNaissance?.dateNais),
      profession: str(a.profession?.libelleCourant),
      region: str(lieu.region),
      departement: str(lieu.departement),
      numDepartement: str(lieu.numDepartement),
      numCirco: str(lieu.numCirco),
      photoUrl: `https://www2.assemblee-nationale.fr/static/tribun/17/photos/${uid.replace('PA', '')}.jpg`,
      actif,
      groupeId: gpCourant ? xmlText(gpCourant.organes?.organeRef) : null,
      roleGroupe: gpCourant?.infosQualite?.libQualite ?? null,
    })
  }

  return { groupes, elus, appartenances }
}

// ------------------------------------------------------------------ scrutins

export interface AnZipHead {
  size: number
  total: number
  cdOff: number
  cdSize: number
  etag: string | null
}

/** Sonde à 22 octets : combien de scrutins le zip contient-il aujourd'hui ? */
export async function anZipHead(): Promise<AnZipHead> {
  const head = await fetch(AN_SCRUTINS_ZIP, { method: 'HEAD' })
  if (!head.ok) throw new Error(`HEAD ${AN_SCRUTINS_ZIP} → HTTP ${head.status}`)
  const size = Number(head.headers.get('content-length'))
  const etag = head.headers.get('etag')
  const eocd = await rangeGet(AN_SCRUTINS_ZIP, size - 22, size - 1)
  if (eocd.readUInt32LE(0) !== 0x06054b50) throw new Error('EOCD introuvable (commentaire zip ?)')
  const total = eocd.readUInt16LE(10)
  if (total === 0xffff) throw new Error('Zip64 : plus de 65535 entrées, parseur à étendre')
  return { size, total, cdSize: eocd.readUInt32LE(12), cdOff: eocd.readUInt32LE(16), etag }
}

export interface AnEntry {
  numero: number
  name: string
  crc: string // hex
  csize: number
  lho: number
}

/** Manifeste complet (~590 Ko) : un CRC32 par scrutin, sans rien décompresser. */
export async function anManifest(head?: AnZipHead): Promise<{ head: AnZipHead; entries: AnEntry[] }> {
  const h = head ?? (await anZipHead())
  const cd = await rangeGet(AN_SCRUTINS_ZIP, h.cdOff, h.cdOff + h.cdSize - 1, h.etag)
  const entries: AnEntry[] = []
  let p = 0
  for (let i = 0; i < h.total; i++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error(`signature central directory invalide à ${p}`)
    const crc = cd.readUInt32LE(p + 16)
    const csize = cd.readUInt32LE(p + 20)
    const nlen = cd.readUInt16LE(p + 28)
    const elen = cd.readUInt16LE(p + 30)
    const clen = cd.readUInt16LE(p + 32)
    const lho = cd.readUInt32LE(p + 42)
    const name = cd.toString('utf8', p + 46, p + 46 + nlen)
    const m = name.match(/V(\d+)\.json$/i)
    if (m) entries.push({ numero: Number(m[1]), name, crc: crc.toString(16).padStart(8, '0'), csize, lho })
    p += 46 + nlen + elen + clen
  }
  return { head: h, entries }
}

/** Récupère et décompresse UN scrutin (1 requête, ~5,4 Ko). */
export async function anFetchScrutin(e: AnEntry, head: AnZipHead): Promise<any> {
  // On sur-lit 256 o pour couvrir nom + extra field de l'en-tête local, sans
  // jamais mordre sur le central directory.
  const end = Math.min(e.lho + 30 + 256 + e.csize, head.cdOff - 1)
  const buf = await rangeGet(AN_SCRUTINS_ZIP, e.lho, end, head.etag)
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error('en-tête local de zip invalide')
  const nlen = buf.readUInt16LE(26)
  const elen = buf.readUInt16LE(28)
  const start = 30 + nlen + elen
  const raw = buf.subarray(start, start + e.csize)
  const json = zlib.inflateRawSync(raw) // méthode 8 = deflate brut
  return JSON.parse(json.toString('utf8')).scrutin
}

/**
 * Chargement massif (backfill) : un seul téléchargement, décompression filtrée.
 * Si le zip en cache est plus ancien que ce que publie le serveur (comparaison
 * du nombre d'entrées), il est retéléchargé — sinon un backfill « complet »
 * raterait silencieusement les derniers scrutins.
 */
export async function anAllScrutins(
  force = false,
  filter?: (numero: number) => boolean,
  totalAttendu?: number,
): Promise<any[]> {
  const lire = async (f: boolean) => {
    const buf = await download(AN_SCRUTINS_ZIP, { filename: 'Scrutins.json.zip', force: f })
    return unzip(buf, (name) => name.endsWith('.json'))
  }

  let files = await lire(force)
  if (!force && totalAttendu && Object.keys(files).length < totalAttendu) {
    console.log(
      `  ⚠ zip en cache incomplet (${Object.keys(files).length}/${totalAttendu} scrutins) → retéléchargement`,
    )
    files = await lire(true)
  }

  const out: any[] = []
  for (const [name, bytes] of Object.entries(files)) {
    if (filter) {
      const m = name.match(/V(\d+)\.json$/i)
      if (!m || !filter(Number(m[1]))) continue
    }
    out.push(JSON.parse(dec.decode(bytes)).scrutin)
  }
  return out
}
