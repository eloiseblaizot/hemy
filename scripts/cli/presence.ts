import { closeDb } from '../lib/prisma'
import { calculerPresence } from '../compute-presence'

await calculerPresence()
await closeDb()
