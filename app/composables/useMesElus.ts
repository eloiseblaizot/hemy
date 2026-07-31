// « Mes élus » : ensemble d'identifiants d'élus persistés en localStorage.
// SSR-safe : valeur par défaut au rendu serveur, hydratation dans onMounted.
const KEY = 'hemy:mes-elus'
const LEGACY_KEY = 'hemicycle:mes-elus'

export function useMesElus() {
  const ids = useState<string[]>('mes-elus', () => [])
  const loaded = useState<boolean>('mes-elus-loaded', () => false)

  onMounted(() => {
    if (loaded.value) return
    try {
      // Reprise de l'ancienne clé (nom de projet précédent) si besoin.
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
      if (raw) ids.value = JSON.parse(raw)
    } catch {
      /* ignore */
    }
    loaded.value = true
    watch(
      ids,
      (v) => {
        try {
          localStorage.setItem(KEY, JSON.stringify(v))
        } catch {
          /* ignore */
        }
      },
      { deep: true },
    )
  })

  const has = (id: string) => ids.value.includes(id)
  const toggle = (id: string) => {
    ids.value = has(id) ? ids.value.filter((x) => x !== id) : [...ids.value, id]
  }
  const add = (id: string) => {
    if (!has(id)) ids.value = [...ids.value, id]
  }
  const remove = (id: string) => {
    ids.value = ids.value.filter((x) => x !== id)
  }

  return { ids, has, toggle, add, remove, loaded }
}
