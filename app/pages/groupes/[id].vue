<script setup lang="ts">
import { computed } from 'vue'
import { CHAMBRE_META, type Chambre } from '#shared/types'

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data, error } = await useFetch(() => `/api/groupes/${encodeURIComponent(id.value)}`, { key: `groupe-${id.value}` })
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Groupe introuvable', fatal: true })

const groupe = computed(() => data.value!.groupe)
const membres = computed(() => data.value!.membres)

useSeoMeta({ title: () => `${groupe.value.libelle} — groupe`, description: () => `Membres et informations du groupe ${groupe.value.libelle}.` })
</script>

<template>
  <div>
    <NuxtLink :to="`/chambre/${groupe.chambre === 'SENAT' ? 'senat' : 'assemblee-nationale'}`" class="text-sm text-brand-400 hover:text-brand-700">
      ← {{ CHAMBRE_META[groupe.chambre as Chambre]?.label }}
    </NuxtLink>

    <header class="mt-3 overflow-hidden rounded-2xl border border-brand-200/70 bg-white">
      <div class="h-2" :style="{ backgroundColor: groupe.couleur }" />
      <div class="flex items-center gap-4 p-5">
        <span class="inline-block h-10 w-10 shrink-0 rounded-full" :style="{ backgroundColor: groupe.couleur }" />
        <div>
          <div class="flex items-center gap-2">
            <ChambreTag :chambre="groupe.chambre" />
            <span class="text-xs font-semibold uppercase tracking-wide text-brand-400">{{ groupe.code }}</span>
          </div>
          <h1 class="mt-1 text-xl font-bold text-brand-900 md:text-2xl">{{ groupe.libelle }}</h1>
          <p class="text-sm text-brand-500">{{ data!.nbMembres }} membres</p>
        </div>
      </div>
    </header>

    <section class="mt-6">
      <h2 class="mb-3 font-bold text-brand-900">Membres</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <EluCard v-for="e in membres" :key="e.id" :elu="{ ...e, chambre: groupe.chambre, groupe }" />
      </div>
    </section>
  </div>
</template>
