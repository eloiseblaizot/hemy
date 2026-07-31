export default defineEventHandler(async () => {
  return { items: await departements() }
})
