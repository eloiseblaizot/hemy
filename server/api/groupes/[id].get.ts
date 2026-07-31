export default defineEventHandler(async (event) => {
  const id = decodeURIComponent(getRouterParam(event, 'id') || '')
  const data = await groupeDetail(id)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Groupe introuvable' })
  return data
})
