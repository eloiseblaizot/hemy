/**
 * Postgres local de développement, sans Docker (paquet `embedded-postgres`,
 * qui embarque un vrai PostgreSQL 18 avec unaccent, pg_trgm et le stemmer
 * français). Laisser tourner dans un terminal :
 *
 *   npm run db:dev
 *
 * Le cluster s'arrête quand le process se termine — d'où l'attente infinie et
 * l'absence de process.exit().
 */
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'

const DATA_DIR = './.pgdata'
const PORT = Number(process.env.DEV_DB_PORT || 55432)
const USER = 'hemy'
const PASSWORD = 'hemy'
const DB = 'hemy'

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true, // ne pas supprimer le datadir à l'arrêt
  initdbFlags: ['--encoding=UTF8'],
  postgresFlags: ['-c', 'shared_buffers=256MB', '-c', 'maintenance_work_mem=256MB'],
})

// initialise() jette si le dossier existe et n'est pas vide.
if (!existsSync(`${DATA_DIR}/PG_VERSION`)) {
  console.log('▸ Initialisation du cluster local…')
  await pg.initialise()
}

await pg.start()
try {
  await pg.createDatabase(DB)
  console.log(`▸ Base « ${DB} » créée`)
} catch {
  /* déjà créée */
}

const url = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB}`
console.log(`\n✅ Postgres local prêt\n   ${url}\n`)
console.log('   Ajoutez dans .env :')
console.log(`   DATABASE_URL="${url}"`)
console.log(`   DIRECT_URL="${url}"\n`)
console.log('   (Ctrl+C pour arrêter)')

const stop = async () => {
  console.log('\n▸ Arrêt du cluster…')
  await pg.stop().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

await new Promise(() => {})
