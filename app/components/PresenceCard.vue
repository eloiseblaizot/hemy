<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  TITRE_INDICATEUR, PERIMETRES, MOTIFS, AVERTISSEMENTS, NOTE_SENAT,
  MENTION_SANS_CLASSEMENT, situer,
} from '#shared/presence'
import { formatNumber } from '#shared/format'

interface Stat {
  perimetre: string
  eligibles: number
  neutralises: number
  personnels: number
  delegations: number
  taux: number | null
  applicable: boolean
  motif: string | null
}
interface Distribution {
  perimetre: string
  mediane: number
  p10: number
  p90: number
  nbElus: number
}

const props = defineProps<{ chambre: string; stats: Stat[]; distributions: Distribution[] }>()

const detailsOuverts = ref(false)
const secondaireOuvert = ref(false)

const principal = computed(() => props.stats.find((s) => s.perimetre === 'SOLENNEL'))
const secondaire = computed(() => props.stats.find((s) => s.perimetre === 'TOUS'))
const distri = (p: string) => props.distributions.find((d) => d.perimetre === p)

const denominateur = (s: Stat) => s.eligibles - s.neutralises

const position = computed(() => {
  const s = principal.value
  const d = distri('SOLENNEL')
  if (!s?.applicable || s.taux === null || !d) return null
  return situer(s.taux, d.mediane, d.p10, d.p90)
})
</script>

<template>
  <!-- Sénat : la donnée de présence n'existe pas, on l'explique. -->
  <section v-if="chambre === 'SENAT'" class="rounded-2xl border border-brand-200/70 bg-white p-5">
    <h2 class="font-bold text-brand-900">Pourquoi pas de taux de présence ?</h2>
    <div class="mt-2 space-y-2 text-sm leading-relaxed text-brand-600">
      <p v-for="(t, i) in NOTE_SENAT" :key="i">{{ t }}</p>
    </div>
  </section>

  <section v-else-if="principal" class="rounded-2xl border border-brand-200/70 bg-white p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="font-bold text-brand-900">{{ TITRE_INDICATEUR }}</h2>
      <span class="text-xs text-brand-400">{{ PERIMETRES.SOLENNEL.titre }}</span>
    </div>

    <!-- Indicateur non applicable -->
    <p v-if="!principal.applicable" class="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-600">
      {{ principal.motif ? MOTIFS[principal.motif] : 'Indicateur non calculable.' }}
    </p>

    <!-- Indicateur -->
    <template v-else>
      <div class="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span class="text-4xl font-bold tabular-nums text-brand-900">{{ principal.taux!.toFixed(0) }} %</span>
        <span class="text-sm text-brand-500">
          {{ formatNumber(principal.personnels) }} votes personnels sur {{ formatNumber(denominateur(principal)) }} scrutins solennels tenus pendant son mandat
        </span>
      </div>

      <div class="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div class="h-full rounded-full bg-brand-500" :style="{ width: Math.min(100, principal.taux!) + '%' }" />
      </div>

      <p v-if="position && distri('SOLENNEL')" class="mt-2 text-sm text-brand-500">
        Situé <b class="font-medium text-brand-700">{{ position }}</b> — la médiane est de
        {{ distri('SOLENNEL')!.mediane.toFixed(0) }} %.
      </p>
    </template>

    <!-- Délégations : une information en soi -->
    <p v-if="principal.delegations > 0" class="mt-3 border-t border-brand-100 pt-3 text-sm text-brand-600">
      <b class="font-medium">{{ formatNumber(principal.delegations) }}</b> vote{{ principal.delegations > 1 ? 's' : '' }}
      émis en son nom par un collègue (délégation), non compté{{ principal.delegations > 1 ? 's' : '' }} ci-dessus.
    </p>
    <p v-if="principal.neutralises > 0" class="mt-1 text-sm text-brand-600">
      <b class="font-medium">{{ formatNumber(principal.neutralises) }}</b> scrutin{{ principal.neutralises > 1 ? 's' : '' }}
      retiré{{ principal.neutralises > 1 ? 's' : '' }} du calcul (fonction empêchant de voter).
    </p>

    <!-- Périmètre secondaire, replié -->
    <div v-if="secondaire" class="mt-3 border-t border-brand-100 pt-3">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left text-sm font-medium text-brand-600 hover:text-brand-900"
        @click="secondaireOuvert = !secondaireOuvert"
      >
        <span>{{ PERIMETRES.TOUS.titre }}</span>
        <span class="text-brand-400">{{ secondaireOuvert ? '−' : '+' }}</span>
      </button>
      <div v-if="secondaireOuvert" class="mt-2 text-sm text-brand-600">
        <p v-if="!secondaire.applicable">{{ secondaire.motif ? MOTIFS[secondaire.motif] : 'Non calculable.' }}</p>
        <template v-else>
          <p>
            <b class="text-brand-900">{{ secondaire.taux!.toFixed(0) }} %</b>
            — {{ formatNumber(secondaire.personnels) }} votes personnels sur
            {{ formatNumber(denominateur(secondaire)) }} scrutins.
            <span v-if="distri('TOUS')"> La médiane des députés est de {{ distri('TOUS')!.mediane.toFixed(0) }} %.</span>
          </p>
        </template>
        <p class="mt-1 text-xs text-brand-400">{{ PERIMETRES.TOUS.description }}</p>
      </div>
    </div>

    <!-- Mise en garde -->
    <div class="mt-4 rounded-xl bg-abstention-soft/60 p-3">
      <p class="text-sm font-medium text-brand-800">{{ AVERTISSEMENTS[0] }}</p>
      <button
        type="button"
        class="mt-1 text-sm font-medium text-brand-600 underline hover:text-brand-900"
        @click="detailsOuverts = !detailsOuverts"
      >
        {{ detailsOuverts ? 'Masquer les explications' : 'Pourquoi ? Comment est-ce calculé ?' }}
      </button>
      <div v-if="detailsOuverts" class="mt-2 space-y-2 text-sm leading-relaxed text-brand-600">
        <p v-for="(t, i) in AVERTISSEMENTS.slice(1)" :key="i">{{ t }}</p>
        <p class="text-xs text-brand-500">
          {{ MENTION_SANS_CLASSEMENT }}
          Source : open data de l'Assemblée nationale (scrutins publics et mandats).
        </p>
      </div>
    </div>
  </section>
</template>
