export default defineEventHandler(async (event) => {
  const id = decodeURIComponent(getRouterParam(event, 'id') || '')
  const data = await scrutinDetail(id)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Scrutin introuvable' })
  return data
})
