import { closeDb } from '../lib/prisma'
import { reindexerRecherche } from '../reindex-search'

await reindexerRecherche()
await closeDb()
