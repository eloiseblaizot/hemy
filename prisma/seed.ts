// Le peuplement se fait via les scripts d'ingestion (`npm run ingest`),
// à partir de l'open data de l'Assemblée nationale et du Sénat — pas via
// un seed statique. Ce fichier existe pour que `prisma migrate dev` dispose
// d'une commande de seed valide (déclarée dans prisma.config.ts).
console.log(
  'ℹ️  Pas de seed statique. Lancez `npm run ingest` pour peupler la base depuis l\'open data AN/Sénat.',
)
