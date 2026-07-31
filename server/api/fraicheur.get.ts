export default defineEventHandler(async () => {
  const { derniereMaj, runs } = await fraicheur()
  const heures = derniereMaj ? (Date.now() - derniereMaj.getTime()) / 3_600_000 : null
  return {
    derniereMaj,
    runs,
    // Au-delà de 48 h sans succès, la synchronisation est probablement cassée.
    obsolete: heures === null || heures > 48,
  }
})
