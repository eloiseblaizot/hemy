import { pathToFileURL } from 'node:url'

/**
 * Vrai si le module passé est le point d'entrée de la commande.
 * `file://${process.argv[1]}` ne suffit pas : un chemin contenant un espace
 * est encodé (%20) dans import.meta.url mais pas dans argv.
 */
export function estPointEntree(metaUrl: string): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  return metaUrl === pathToFileURL(entry).href
}
