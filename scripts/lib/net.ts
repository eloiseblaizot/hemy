// Utilitaires réseau/fichiers pour l'ingestion open data.
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { unzipSync } from 'fflate'
import iconv from 'iconv-lite'

export const CACHE_DIR = join(process.cwd(), '.ingest-cache')

function md5(buf: Buffer): string {
  return createHash('md5').update(buf).digest('hex')
}

export interface DownloadOpts {
  filename?: string
  md5?: string
  force?: boolean
  chunkSize?: number
}

/**
 * Télécharge une URL vers un cache disque, avec reprise par plages (Range) si
 * la réponse est tronquée (certains proxys plafonnent les GET volumineux).
 */
export async function download(url: string, opts: DownloadOpts = {}): Promise<Buffer> {
  const filename = opts.filename ?? decodeURIComponent(url.split('/').pop() || 'download.bin')
  const cachePath = join(CACHE_DIR, filename)

  if (!opts.force && existsSync(cachePath)) {
    const cached = await readFile(cachePath)
    if (!opts.md5 || md5(cached) === opts.md5) {
      console.log(`  ↺ cache : ${filename} (${fmt(cached.length)})`)
      return cached
    }
  }

  console.log(`  ↓ ${url}`)
  let buf = await fetchFull(url, opts.chunkSize)
  if (opts.md5 && md5(buf) !== opts.md5) {
    console.warn(`  ⚠ MD5 inattendu pour ${filename}, tentative par plages…`)
    buf = await fetchRanged(url, buf.length || 0, opts.chunkSize)
    if (opts.md5 && md5(buf) !== opts.md5) {
      throw new Error(`MD5 toujours incorrect pour ${filename} après reprise.`)
    }
  }
  await mkdir(dirname(cachePath), { recursive: true })
  await writeFile(cachePath, buf)
  console.log(`  ✓ ${filename} (${fmt(buf.length)})`)
  return buf
}

async function fetchFull(url: string, chunkSize?: number): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`)
  const total = Number(res.headers.get('content-length') || 0)
  const acceptRanges = (res.headers.get('accept-ranges') || '').includes('bytes')
  const buf = Buffer.from(await res.arrayBuffer())
  if (total && buf.length < total && acceptRanges) {
    console.warn(`  ⚠ réponse tronquée (${fmt(buf.length)}/${fmt(total)}), passage en Range…`)
    return fetchRanged(url, total, chunkSize)
  }
  return buf
}

async function fetchRanged(url: string, total: number, chunkSize = 6_000_000): Promise<Buffer> {
  if (!total) {
    const head = await fetch(url, { method: 'HEAD' })
    total = Number(head.headers.get('content-length') || 0)
    if (!total) throw new Error(`Taille inconnue pour ${url}`)
  }
  const parts: Buffer[] = []
  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, total - 1)
    const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } })
    if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status} (Range) pour ${url}`)
    parts.push(Buffer.from(await res.arrayBuffer()))
    process.stdout.write(`\r    …${fmt(Math.min(end + 1, total))}/${fmt(total)}`)
  }
  process.stdout.write('\n')
  return Buffer.concat(parts)
}

/** Décompresse un zip en mémoire -> { chemin: contenu }. */
export function unzip(buf: Buffer, filter?: (name: string) => boolean): Record<string, Uint8Array> {
  return unzipSync(new Uint8Array(buf), filter ? { filter: (f) => filter(f.name) } : undefined)
}

/** Requête HTTP Range (octets a..b inclus). Exige une réponse 206. */
export async function rangeGet(
  url: string,
  a: number,
  b: number,
  etag?: string | null,
): Promise<Buffer> {
  const headers: Record<string, string> = { Range: `bytes=${a}-${b}` }
  // Garde-fou : si le fichier distant a été régénéré entre-temps, les offsets
  // du manifeste seraient obsolètes -> on veut un échec explicite (412).
  if (etag) headers['If-Match'] = etag
  const r = await fetch(url, { headers })
  if (r.status === 412) throw new Error('ETAG_CHANGED')
  if (r.status !== 206) throw new Error(`Range non supporté : HTTP ${r.status} pour ${url}`)
  return Buffer.from(await r.arrayBuffer())
}

/** Décode un buffer Windows-1252/Latin-1 en chaîne UTF-8. */
export function decodeLatin1(buf: Buffer | Uint8Array): string {
  return iconv.decode(Buffer.from(buf), 'win1252')
}

/** Formatte une taille en octets de façon lisible. */
export function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}
