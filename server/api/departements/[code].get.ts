export default defineEventHandler(async (event) => {
  const code = decodeURIComponent(getRouterParam(event, 'code') || '')
  return { code, elus: await elusByDepartement(code) }
})
