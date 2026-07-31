import { closeDb } from '../lib/prisma'
import { verifierSchema } from '../lib/preflight'
import { reindexerRecherche } from '../reindex-search'

await verifierSchema()
await reindexerRecherche()
await closeDb()
