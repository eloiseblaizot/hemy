<script setup lang="ts">
import { computed } from 'vue'
import type { Siege } from '#shared/types'

const route = useRoute()
const param = computed(() => String(route.params.chambre))
const { data, error } = await useFetch(() => `/api/chambre/${encodeURIComponent(param.value)}`, { key: `chambre-${param.value}` })
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Chambre inconnue', fatal: true })

const groupes = computed(() => data.value!.groupes)
const scrutins = computed(() => data.value!.scrutins)
const chambre = computed(() => groupes.value[0]?.chambre || (param.value.includes('senat') ? 'SENAT' : 'AN'))
const label = computed(() => (chambre.value === 'SENAT' ? 'Sénat' : 'Assemblée nationale'))
const totalMembres = computed(() => groupes.value.reduce((a, g) => a + g.nbMembres, 0))

// Sièges de composition (couleur par groupe) pour l'hémicycle.
const seats = computed<Siege[]>(() =>
  groupes.value.flatMap((g) =>
    Array.from({ length: g.nbMembres }, () => ({
      position: 'POUR' as const,
      couleur: g.couleur,
      ordre: g.ordre,
      groupeCode: g.code,
      groupeLibelle: g.libelle,
    })),
  ),
)

useSeoMeta({ title: () => `${label.value} — scrutins et composition`, description: () => `Composition et derniers scrutins : ${label.value}.` })
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-brand-900 md:text-3xl">{{ label }}</h1>
        <p class="mt-1 text-sm text-brand-500">{{ totalMembres }} sièges · {{ data!.totalScrutins }} scrutins publics recensés</p>
      </div>
    </header>

    <!-- Composition -->
    <section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5">
      <h2 class="mb-2 font-bold text-brand-900">Composition</h2>
      <div class="mx-auto max-w-2xl">
        <Hemicycle :seats="seats" mode="groupe" :seat-radius="7" hide-legend />
      </div>
      <ul class="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <li v-for="g in groupes" :key="g.id">
          <NuxtLink :to="`/groupes/${encodeURIComponent(g.id)}`" class="flex items-center gap-1.5 hover:underline">
            <span class="inline-block h-3 w-3 rounded-full" :style="{ backgroundColor: g.couleur }" />
            <span class="font-medium text-brand-700">{{ g.code }}</span>
            <span class="tabular-nums text-brand-400">{{ g.nbMembres }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Derniers scrutins -->
    <section class="mt-6">
      <h2 class="mb-3 font-bold text-brand-900">Derniers scrutins</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <ScrutinCard v-for="s in scrutins" :key="s.id" :scrutin="s" />
      </div>
    </section>
  </div>
</template>
