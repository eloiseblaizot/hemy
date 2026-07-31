// Enveloppe en ligne de commande de la synchronisation.
// Le module `scripts/sync.ts` reste importable par le serveur Nitro : il ne
// doit contenir aucun `await` de premier niveau (cible es2019 côté Nitro).
import { closeDb } from '../lib/prisma'
import { synchronisationEnCours } from '../lib/store'
import { synchroniser } from '../sync'

if (process.env.SYNC_FULL !== '1' && (await synchronisationEnCours())) {
  console.log('⏭  Une synchronisation est déjà en cours (verrou de 20 min). Abandon.')
  await closeDb()
  process.exit(0)
}

try {
  await synchroniser()
} catch (e) {
  console.error('\n✖ Échec :', (e as Error).message)
  await closeDb()
  process.exit(1)
}

await closeDb()
