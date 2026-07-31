<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ elu: any; showStar?: boolean }>(), { showStar: true })
const { has, toggle } = useMesElus()
const to = computed(
  () => `${props.elu.chambre === 'SENAT' ? '/senateurs' : '/deputes'}/${encodeURIComponent(props.elu.slug)}`,
)
</script>

<template>
  <div class="relative flex items-center gap-3 rounded-xl border border-brand-200/70 bg-white p-3 transition-colors hover:border-brand-300">
    <NuxtLink :to="to" class="flex min-w-0 flex-1 items-center gap-3">
      <EluAvatar :photo-url="elu.photoUrl" :prenom="elu.prenom" :nom="elu.nom" :couleur="elu.groupe?.couleur" :size="46" />
      <span class="min-w-0">
        <span class="block truncate font-medium text-brand-900">{{ elu.prenom }} {{ elu.nom }}</span>
        <span class="mt-1 flex items-center gap-2 text-xs text-brand-400">
          <GroupePill v-if="elu.groupe" :groupe="elu.groupe" :link="false" />
          <span class="truncate">{{ elu.departement }}<template v-if="elu.numCirco"> · {{ elu.numCirco }}<sup>e</sup> circ.</template></span>
        </span>
      </span>
    </NuxtLink>
    <button
      v-if="showStar"
      type="button"
      class="shrink-0 rounded-full p-1.5 text-lg leading-none transition-colors"
      :class="has(elu.id) ? 'text-amber-500' : 'text-brand-300 hover:text-brand-500'"
      :aria-pressed="has(elu.id)"
      :title="has(elu.id) ? 'Retirer de mes élus' : 'Ajouter à mes élus'"
      @click="toggle(elu.id)"
    >
      {{ has(elu.id) ? '★' : '☆' }}
    </button>
  </div>
</template>
