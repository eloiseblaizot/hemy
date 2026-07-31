<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDate, pct } from '#shared/format'
import { POSITION_META, termeElu, type Chambre, type Position } from '#shared/types'

const props = defineProps<{ slug: string }>()
const { data, error } = await useFetch(() => `/api/elus/${encodeURIComponent(props.slug)}`, { key: `elu-${props.slug}` })
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Élu introuvable', fatal: true })

const elu = computed(() => data.value!.elu)
const stats = computed(() => data.value!.stats as Record<Position, number>)
const total = computed(() => data.value!.total)
const presence = computed(() => (data.value!.presence ?? []) as any[])
const distributions = computed(() => (data.value!.distributions ?? []) as any[])
const { has, toggle } = useMesElus()

const votes = ref<any[]>([...(data.value!.votes as any[])])
const votesTotal = ref<number>(data.value!.votesTotal)
const position = ref<'' | Position>('')

async function reload() {
  const r = await $fetch<{ votes: any[]; total: number }>(`/api/elus/${encodeURIComponent(props.slug)}/votes`, {
    params: { position: position.value || undefined, offset: 0, limit: 20 },
  })
  votes.value = r.votes
  votesTotal.value = r.total
}
async function loadMore() {
  const r = await $fetch<{ votes: any[]; total: number }>(`/api/elus/${encodeURIComponent(props.slug)}/votes`, {
    params: { position: position.value || undefined, offset: votes.value.length, limit: 20 },
  })
  votes.value.push(...r.votes)
}
watch(position, reload)

const filters: { key: '' | Position; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'POUR', label: 'Pour' },
  { key: 'CONTRE', label: 'Contre' },
  { key: 'ABSTENTION', label: 'Abstention' },
  { key: 'NON_VOTANT', label: 'N’a pas pris part' },
]

useSeoMeta({
  title: () => `${elu.value.prenom} ${elu.value.nom} — votes`,
  description: () => `Historique de votes de ${elu.value.prenom} ${elu.value.nom}.`,
})
</script>

<template>
  <div>
    <!-- En-tête -->
    <header class="flex flex-col gap-4 rounded-2xl border border-brand-200/70 bg-white p-5 sm:flex-row sm:items-center">
      <EluAvatar :photo-url="elu.photoUrl" :prenom="elu.prenom" :nom="elu.nom" :couleur="elu.groupe?.couleur" :size="80" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <ChambreTag :chambre="elu.chambre" />
          <span class="text-xs capitalize text-brand-400">{{ termeElu(elu.chambre as Chambre) }}</span>
        </div>
        <h1 class="mt-1 text-2xl font-bold text-brand-900">{{ elu.prenom }} {{ elu.nom }}</h1>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-500">
          <GroupePill v-if="elu.groupe" :groupe="elu.groupe" />
          <span v-if="elu.roleGroupe && elu.roleGroupe !== 'Membre du' && elu.roleGroupe !== 'membre'">· {{ elu.roleGroupe }}</span>
          <span v-if="elu.departement">· {{ elu.departement }}<template v-if="elu.numCirco"> ({{ elu.numCirco }}<sup>e</sup> circ.)</template></span>
          <span v-if="elu.profession" class="text-brand-400">· {{ elu.profession }}</span>
        </div>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        :class="has(elu.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-brand-200 text-brand-600 hover:bg-brand-50'"
        @click="toggle(elu.id)"
      >
        {{ has(elu.id) ? '★ Suivi' : '☆ Suivre' }}
      </button>
    </header>

    <!-- Votes en personne (AN) / explication (Sénat) -->
    <div class="mt-5">
      <PresenceCard :chambre="elu.chambre" :stats="presence" :distributions="distributions" />
    </div>

    <!-- Positions enregistrées -->
    <section class="mt-5">
      <h2 class="mb-2 font-bold text-brand-900">Positions enregistrées</h2>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="p in (['POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT'] as Position[])" :key="p" class="rounded-xl border border-brand-200/70 bg-white p-3">
          <div class="text-2xl font-bold tabular-nums" :style="{ color: POSITION_META[p].couleur }">{{ stats[p] }}</div>
          <div class="text-xs text-brand-500">{{ POSITION_META[p].label }} · {{ pct(stats[p], total) }}%</div>
        </div>
      </div>
    </section>

    <!-- Votes -->
    <section class="mt-6">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-bold text-brand-900">Votes <span class="font-normal text-brand-400">({{ votesTotal }})</span></h2>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="f in filters"
            :key="f.key"
            class="rounded-full px-3 py-1 text-xs font-medium transition"
            :class="position === f.key ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-600 hover:bg-brand-200'"
            @click="position = f.key"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <ul class="space-y-2">
        <li v-for="(v, i) in votes" :key="i">
          <NuxtLink
            :to="`/scrutins/${encodeURIComponent(v.scrutin.id)}`"
            class="flex items-center gap-3 rounded-xl border border-brand-200/70 bg-white p-3 transition-colors hover:border-brand-300"
          >
            <PositionBadge :position="v.position" :cause="v.cause" :par-delegation="v.parDelegation" />
            <span class="min-w-0 flex-1">
              <span class="line-clamp-2 text-sm text-brand-800">{{ v.scrutin.titre }}</span>
              <span class="mt-0.5 block text-xs text-brand-400">{{ formatDate(v.scrutin.date, { day: 'numeric', month: 'short', year: 'numeric' }) }} · {{ v.scrutin.sortCode }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>

      <button
        v-if="votes.length < votesTotal"
        class="mx-auto mt-4 block rounded-full border border-brand-200 px-5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        @click="loadMore"
      >
        Voir plus
      </button>
    </section>
  </div>
</template>
