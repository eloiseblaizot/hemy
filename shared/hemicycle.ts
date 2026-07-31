// Placement des sièges d'un hémicycle (demi-cercle), SSR-safe, sans dépendance.
// Inspiré de l'algorithme MIT de d3-parliament-chart (dkaoster), réécrit ici.

export interface SeatPoint {
  x: number
  y: number
  row: number
  angle: number
}

export interface HemicycleOptions {
  width?: number
  seatRadius?: number
  rowHeight?: number
}

/**
 * Retourne `totalSeats` positions {x,y} réparties sur des rangées d'arcs
 * concentriques, triées par angle (gauche -> droite). viewBox conseillé :
 * `0 0 width width/2`.
 */
export function computeSeatPositions(totalSeats: number, options: HemicycleOptions = {}): SeatPoint[] {
  const width = options.width ?? 1000
  const seatRadius = options.seatRadius ?? 8
  const rowHeight = options.rowHeight ?? 22
  const height = width / 2
  const cx = width / 2
  const cy = height
  const graphRadius = height - seatRadius
  if (totalSeats <= 0) return []

  // 1) Capacité de chaque rangée, du bord extérieur vers le centre.
  const rows: { r: number; cap: number }[] = []
  let capacity = 0
  let row = 0
  while (capacity < totalSeats && row < 200) {
    const r = graphRadius - rowHeight * row
    if (r < rowHeight) break
    const minStep = Math.atan((2.5 * seatRadius) / r)
    const seatsThisRow = Math.max(1, Math.floor(Math.PI / minStep))
    rows.push({ r, cap: seatsThisRow })
    capacity += seatsThisRow
    row++
  }
  if (!rows.length) rows.push({ r: graphRadius, cap: totalSeats })

  // 2) Répartition proportionnelle par plus forts restes (somme exacte).
  const totalCap = rows.reduce((s, x) => s + x.cap, 0)
  const raw = rows.map((rw) => (totalSeats * rw.cap) / totalCap)
  const counts = raw.map((v) => Math.floor(v))
  let rem = totalSeats - counts.reduce((a, b) => a + b, 0)
  const byFrac = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  for (let k = 0; rem > 0 && byFrac.length; k++, rem--) counts[byFrac[k % byFrac.length].i]++

  // 3) Placement régulier sur chaque rangée.
  const points: SeatPoint[] = []
  rows.forEach((rw, ri) => {
    const n = counts[ri]
    for (let i = 0; i < n; i++) {
      const angle = n === 1 ? Math.PI / 2 : (i / (n - 1)) * Math.PI
      points.push({
        x: cx - rw.r * Math.cos(angle),
        y: cy - rw.r * Math.sin(angle),
        row: ri,
        angle,
      })
    }
  })

  return points.sort((a, b) => a.angle - b.angle)
}
