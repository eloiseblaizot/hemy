export default defineEventHandler(async (event) => {
  const slug = decodeURIComponent(getRouterParam(event, 'slug') || '')
  const q = getQuery(event)
  const data = await eluBySlug(slug)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Élu introuvable' })
  const position = typeof q.position === 'string' ? q.position : undefined
  const { votes, total } = await eluVotes(data.elu.id, { limit: 20, offset: 0, position })
  return { ...data, votes, votesTotal: total }
})
