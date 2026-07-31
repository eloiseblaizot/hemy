<script setup lang="ts">
import { computed } from 'vue'
import { POSITION_META, type Position } from '#shared/types'
import { libellePosition } from '#shared/presence'

const props = defineProps<{ position: Position; cause?: string | null; parDelegation?: boolean }>()
const meta = computed(() => POSITION_META[props.position])
const cls = computed(
  () =>
    ({
      POUR: 'bg-pour-soft text-pour',
      CONTRE: 'bg-contre-soft text-contre',
      ABSTENTION: 'bg-abstention-soft text-abstention',
      NON_VOTANT: 'bg-nonvotant-soft text-brand-600',
    })[props.position],
)
/** Précision complète (délégation, fonction) en infobulle et pour les lecteurs d'écran. */
const detail = computed(() => libellePosition(props.position, props.cause, props.parDelegation))
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
    :class="cls"
    :title="detail"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: meta.couleur }" />
    {{ meta.label }}
    <span v-if="parDelegation" class="font-normal opacity-75" aria-hidden="true">(délég.)</span>
    <span class="sr-only">{{ detail }}</span>
  </span>
</template>
