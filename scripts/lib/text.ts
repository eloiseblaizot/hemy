// Petites aides texte partagées par les scripts d'ingestion.

/** Slugifie une chaîne (sans accents, minuscules, tirets). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Génère un slug unique en gardant trace de ceux déjà utilisés. */
export function makeUniqueSlug(base: string, used: Set<string>, fallback: string): string {
  let slug = slugify(base) || slugify(fallback) || fallback.toLowerCase()
  if (used.has(slug)) {
    let i = 2
    while (used.has(`${slug}-${i}`)) i++
    slug = `${slug}-${i}`
  }
  used.add(slug)
  return slug
}

/**
 * Extrait la valeur d'un champ pouvant être une string simple ou un objet
 * { "#text": "..." } (artefact XML->JSON de l'open data AN).
 */
export function xmlText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    if (typeof o['#text'] === 'string') return o['#text'] as string
  }
  return null
}

/** Normalise une valeur potentiellement { "@xsi:nil": "true" } ou null. */
export function isNil(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    if (o['@xsi:nil'] === 'true' || o['@xsi:nil'] === true) return true
  }
  return false
}

/**
 * Normalise un champ texte de l'open data, qui peut arriver sous la forme
 * d'une chaîne, d'un objet { "#text": … } ou d'un objet vide
 * { "@xsi:nil": "true" }.
 */
export function str(value: unknown): string | null {
  if (isNil(value)) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return String(value)
  const t = xmlText(value)
  return t ? t.trim() || null : null
}

/** Force une valeur en tableau (l'open data collapse parfois les listes d'1 élément). */
export function toArray<T = unknown>(value: unknown): T[] {
  if (value == null) return []
  return Array.isArray(value) ? (value as T[]) : [value as T]
}

/** Parse un entier depuis une string open data ("72"), sinon 0. */
export function toInt(value: unknown): number {
  if (value == null) return 0
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : 0
}

/** Parse une date ISO ("2025-03-27") en Date, sinon null. */
export function toDate(value: unknown): Date | null {
  if (isNil(value)) return null
  const s = xmlText(value) ?? (typeof value === 'string' ? value : null)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
