import { closeDb } from '../lib/prisma'
import { verifierSchema } from '../lib/preflight'
import { calculerPresence } from '../compute-presence'

await verifierSchema()
await calculerPresence()
await closeDb()
