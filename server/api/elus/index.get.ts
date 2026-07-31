// Récupération par identifiants (fonctionnalité « mes élus » depuis le localStorage).
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const ids = typeof q.ids === 'string' ? q.ids.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100) : []
  return { items: await elusByIds(ids) }
})
