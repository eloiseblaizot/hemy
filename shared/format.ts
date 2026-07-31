// Aides de formatage partagées (FR).

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', opts ?? { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatDateShort(d: Date | string): string {
  return formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

/** Pourcentage entier, en évitant NaN. */
export function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}
