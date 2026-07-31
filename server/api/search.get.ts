export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const term = typeof q.q === 'string' ? q.q : ''
  const limit = Math.min(Number(q.limit) || 20, 40)
  if (term.trim().length < 2) return { results: [] }
  return { results: await searchAll(term, limit) }
})
