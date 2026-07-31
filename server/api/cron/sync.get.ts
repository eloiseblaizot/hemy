/**
 * Mise à jour quotidienne, déclenchée par le cron Vercel.
 *
 * Vercel n'envoie que des GET, ne réessaie jamais en cas d'échec et peut
 * invoquer deux fois la même exécution planifiée : d'où le verrou et la
 * réconciliation par ensembles côté script.
 *
 * La synchronisation principale du projet est portée par GitHub Actions (aucune
 * limite de durée). Cette route est le filet de sécurité — elle reste dans les
 * limites du plan Hobby car un jour typique représente ~1 Mo et quelques
 * secondes.
 */
import { timingSafeEqual } from 'node:crypto'

function memeSecret(recu: string, attendu: string): boolean {
  const a = Buffer.from(recu)
  const b = Buffer.from(attendu)
  // timingSafeEqual lève si les longueurs diffèrent.
  return a.length === b.length && timingSafeEqual(a, b)
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const secret = process.env.CRON_SECRET
  // Sans secret configuré : on refuse (sinon la route serait publique).
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'CRON_SECRET non configuré' })
  }
  const entete = getHeader(event, 'authorization') || ''
  if (!memeSecret(entete, `Bearer ${secret}`)) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })
  }

  const { synchroniser, synchronisationEnCours } = await import('../../utils/sync-runtime')

  if (await synchronisationEnCours()) {
    return { ok: true, ignore: true, motif: 'synchronisation déjà en cours' }
  }

  try {
    const res = await synchroniser()
    return { ok: true, ...res }
  } catch (err) {
    const e = err as Error
    console.error('[cron/sync]', e)
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
