export default defineEventHandler(async (event) => {
  const slug = decodeURIComponent(getRouterParam(event, 'slug') || '')
  const q = getQuery(event)
  const elu = await prisma.elu.findUnique({ where: { slug }, select: { id: true } })
  if (!elu) throw createError({ statusCode: 404, statusMessage: 'Élu introuvable' })
  const position = typeof q.position === 'string' ? q.position : undefined
  return eluVotes(elu.id, {
    limit: Math.min(Number(q.limit) || 20, 50),
    offset: Number(q.offset) || 0,
    position,
  })
})
