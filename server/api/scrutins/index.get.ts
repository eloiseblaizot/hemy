export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const chambre = typeof q.chambre === 'string' ? q.chambre.toUpperCase() : undefined
  const limit = Math.min(Number(q.limit) || 20, 100)
  const offset = Number(q.offset) || 0
  const [items, total] = await Promise.all([
    latestScrutins({ chambre, limit, offset }),
    countScrutins(chambre),
  ])
  return { items, total }
})
