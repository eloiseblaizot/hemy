export default defineEventHandler(async (event) => {
  const raw = (getRouterParam(event, 'chambre') || '').toUpperCase()
  const chambre = raw === 'AN' || raw === 'ASSEMBLEE-NATIONALE' ? 'AN' : raw === 'SENAT' ? 'SENAT' : null
  if (!chambre) throw createError({ statusCode: 404, statusMessage: 'Chambre inconnue' })
  return chambreOverview(chambre)
})
