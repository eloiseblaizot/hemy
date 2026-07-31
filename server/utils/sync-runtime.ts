/**
 * Pont vers la logique de synchronisation, pour la route cron.
 * Le code est partagé avec la ligne de commande (`npm run sync`) : une seule
 * implémentation, donc un seul comportement à vérifier.
 */
export { synchroniser } from '../../scripts/sync'
export { synchronisationEnCours } from '../../scripts/lib/store'
