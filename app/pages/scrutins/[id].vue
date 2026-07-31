<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDate } from '#shared/format'
import { POSITION_META, type Position, type Siege } from '#shared/types'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))
const { data, error } = await useFetch(() => `/api/scrutins/${encodeURIComponent(id.value)}`, { key: `scrutin-${id.value}` })

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Scrutin introuvable', fatal: true })
}

const scrutin = computed(() => data.value!.scrutin)
const groupes = computed(() => data.value!.groupes)
const sieges = computed<Siege[]>(() => data.value!.sieges as Siege[])
const decompte = computed(() => ({
  pour: scrutin.value.pour,
  contre: scrutin.value.contre,
  abstentions: scrutin.value.abstentions,
  nonVotants: scrutin.value.nonVotants,
}))

const mode = ref<'position' | 'groupe'>('position')

// Détail nominatif groupé par groupe
const ORD: Record<Position, number> = { POUR: 0, CONTRE: 1, ABSTENTION: 2, NON_VOTANT: 3 }
const parGroupe = computed(() => {
  const map = new Map<string, { code: string; libelle: string; couleur: string; ordre: number; membres: Siege[] }>()
  for (const s of sieges.value) {
    const key = s.groupeId || 'na'
    if (!map.has(key)) map.set(key, { code: s.groupeCode || '—', libelle: s.groupeLibelle || 'Sans groupe', couleur: s.couleur || '#9AA5B1', ordre: s.ordre ?? 99, membres: [] })
    map.get(key)!.membres.push(s)
  }
  for (const g of map.values()) g.membres.sort((a, b) => ORD[a.position] - ORD[b.position] || a.nom!.localeCompare(b.nom!, 'fr'))
  return [...map.values()].sort((a, b) => a.ordre - b.ordre)
})

function eluLink(s: Siege): string | null {
  if (!s.slug) return null
  return `${scrutin.value.chambre === 'SENAT' ? '/senateurs' : '/deputes'}/${encodeURIComponent(s.slug)}`
}
function onSeat(s: Siege) {
  const l = eluLink(s)
  if (l) router.push(l)
}

useSeoMeta({
  title: () => `${scrutin.value.titre?.slice(0, 70)} — Scrutin`,
  description: () => `Scrutin n°${scrutin.value.numero} : ${scrutin.value.pour} pour, ${scrutin.value.contre} contre.`,
})
</script>

<template>
  <div v-if="scrutin">
    <NuxtLink to="/" class="text-sm text-brand-400 hover:text-brand-700">← Accueil</NuxtLink>

    <!-- En-tête -->
    <header class="mt-3">
      <div class="flex flex-wrap items-center gap-2 text-sm text-brand-400">
        <ChambreTag :chambre="scrutin.chambre" />
        <span>Scrutin n°{{ scrutin.numero }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ formatDate(scrutin.date) }}</span>
        <SortBadge :sort="scrutin.sortCode" />
      </div>
      <h1 class="mt-2 text-xl font-bold leading-snug text-brand-900 md:text-2xl">{{ scrutin.titre }}</h1>
      <p v-if="scrutin.demandeur" class="mt-1 text-sm text-brand-500">Demandé par : {{ scrutin.demandeur }}</p>
    </header>

    <!-- Décompte -->
    <section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="p in (['POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT'] as Position[])" :key="p" class="rounded-xl bg-brand-50 p-3 text-center">
          <div class="text-2xl font-bold tabular-nums" :style="{ color: POSITION_META[p].couleur }">
            {{ p === 'POUR' ? scrutin.pour : p === 'CONTRE' ? scrutin.contre : p === 'ABSTENTION' ? scrutin.abstentions : scrutin.nonVotants }}
          </div>
          <div class="text-xs font-medium text-brand-500">{{ POSITION_META[p].label }}</div>
        </div>
      </div>
      <div class="mt-4">
        <VoteBar :decompte="decompte" />
      </div>
      <p class="mt-2 text-xs text-brand-400">
        {{ scrutin.nombreVotants }} votants · {{ scrutin.suffragesExprimes }} suffrages exprimés<template v-if="scrutin.nbrSuffragesRequis"> · majorité requise {{ scrutin.nbrSuffragesRequis }}</template>
      </p>
    </section>

    <!-- Hémicycle -->
    <section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="font-bold text-brand-900">Hémicycle</h2>
        <div class="flex rounded-full bg-brand-100 p-0.5 text-xs font-medium">
          <button class="rounded-full px-3 py-1 transition" :class="mode === 'position' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500'" @click="mode = 'position'">Par vote</button>
          <button class="rounded-full px-3 py-1 transition" :class="mode === 'groupe' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500'" @click="mode = 'groupe'">Par groupe</button>
        </div>
      </div>
      <Hemicycle :seats="sieges" :mode="mode" @seat-click="onSeat" />
    </section>

    <!-- Analyse par groupe -->
    <section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5">
      <h2 class="mb-3 font-bold text-brand-900">Par groupe</h2>
      <div class="space-y-2">
        <div v-for="g in groupes" :key="g.id" class="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-brand-100 pb-2 last:border-0">
          <GroupePill :groupe="g" />
          <VoteBar :decompte="{ pour: g.pour, contre: g.contre, abstentions: g.abstentions, nonVotants: g.nonVotants }" />
          <span class="whitespace-nowrap text-xs tabular-nums text-brand-500">
            <b class="text-pour">{{ g.pour }}</b> / <b class="text-contre">{{ g.contre }}</b> / {{ g.abstentions }} / {{ g.nonVotants }}
          </span>
        </div>
      </div>
    </section>

    <!-- Détail nominatif -->
    <section class="mt-6">
      <h2 class="mb-3 font-bold text-brand-900">Détail nominatif</h2>
      <div class="space-y-2">
        <details v-for="g in parGroupe" :key="g.code" class="overflow-hidden rounded-xl border border-brand-200/70 bg-white">
          <summary class="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-brand-800">
            <span class="inline-block h-3 w-3 rounded-full" :style="{ backgroundColor: g.couleur }" />
            {{ g.code }}
            <span class="font-normal text-brand-400">· {{ g.membres.length }} votant·es</span>
          </summary>
          <ul class="divide-y divide-brand-100 border-t border-brand-100">
            <li v-for="(m, i) in g.membres" :key="i" class="flex items-center justify-between gap-3 px-4 py-2">
              <NuxtLink v-if="eluLink(m)" :to="eluLink(m)!" class="min-w-0 truncate text-sm text-brand-800 hover:text-brand-950 hover:underline">
                {{ (m.prenom + ' ' + m.nom).trim() || 'Élu' }}
              </NuxtLink>
              <span v-else class="min-w-0 truncate text-sm text-brand-500">{{ (m.prenom + ' ' + m.nom).trim() || 'Élu' }}</span>
              <PositionBadge :position="m.position" :cause="m.cause" :par-delegation="m.parDelegation" />
            </li>
          </ul>
        </details>
      </div>
    </section>
  </div>
</template>
