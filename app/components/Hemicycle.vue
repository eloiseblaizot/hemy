<script setup lang="ts">
import { computed } from 'vue'
import { POSITION_META, type Position, type Siege } from '#shared/types'
import { computeSeatPositions } from '#shared/hemicycle'

const props = withDefaults(
  defineProps<{ seats: Siege[]; mode?: 'position' | 'groupe'; seatRadius?: number; hideLegend?: boolean }>(),
  { mode: 'position', seatRadius: 8, hideLegend: false },
)
const emit = defineEmits<{ seatClick: [Siege] }>()

const ORD: Record<Position, number> = { POUR: 0, CONTRE: 1, ABSTENTION: 2, NON_VOTANT: 3 }

// Sièges triés par groupe (gauche -> droite) puis par position : le placement
// suit l'ordre du tableau, la couleur dépend du mode.
const sorted = computed(() =>
  [...props.seats].sort(
    (a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || ORD[a.position] - ORD[b.position],
  ),
)
const points = computed(() => computeSeatPositions(sorted.value.length, { seatRadius: props.seatRadius }))

function fill(s: Siege): string {
  return props.mode === 'groupe' ? s.couleur || '#9AA5B1' : POSITION_META[s.position].couleur
}

const counts = computed(() => {
  const c: Record<Position, number> = { POUR: 0, CONTRE: 0, ABSTENTION: 0, NON_VOTANT: 0 }
  for (const s of props.seats) c[s.position]++
  return c
})
const ariaLabel = computed(
  () =>
    `Hémicycle : ${counts.value.POUR} pour, ${counts.value.CONTRE} contre, ` +
    `${counts.value.ABSTENTION} abstentions, ${counts.value.NON_VOTANT} n'ayant pas pris part, ` +
    `sur ${props.seats.length} présents.`,
)
</script>

<template>
  <div class="w-full">
    <svg :viewBox="`0 0 1000 ${1000 / 2 + 14}`" class="h-auto w-full" role="img" :aria-label="ariaLabel">
      <circle
        v-for="(s, i) in sorted"
        v-show="points[i]"
        :key="i"
        :cx="points[i]?.x"
        :cy="points[i]?.y"
        :r="seatRadius"
        :fill="fill(s)"
        :stroke="mode === 'position' ? 'rgba(255,255,255,.65)' : 'rgba(15,23,42,.10)'"
        stroke-width="0.6"
        :class="s.slug ? 'cursor-pointer transition-opacity hover:opacity-70' : ''"
        @click="s.slug && emit('seatClick', s)"
      >
        <title>
          {{ (s.prenom + ' ' + s.nom).trim() || 'Élu' }}{{ s.groupeCode ? ` — ${s.groupeCode}` : '' }} — {{ POSITION_META[s.position].label }}
        </title>
      </circle>
    </svg>

    <ul v-if="!hideLegend" class="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
      <li v-for="p in (['POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT'] as Position[])" :key="p" class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full" :style="{ backgroundColor: POSITION_META[p].couleur }" />
        <span class="font-medium text-brand-700">{{ POSITION_META[p].label }}</span>
        <span class="tabular-nums text-brand-400">{{ counts[p] }}</span>
      </li>
    </ul>
  </div>
</template>
