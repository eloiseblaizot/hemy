<script setup lang="ts">
import { computed } from 'vue'
import { POSITION_META, totalDecompte, type Decompte } from '#shared/types'

const props = withDefaults(defineProps<{ decompte: Decompte; showLabels?: boolean }>(), { showLabels: false })

const total = computed(() => totalDecompte(props.decompte))
const segments = computed(() => {
  const t = total.value || 1
  return (
    [
      { key: 'POUR', v: props.decompte.pour },
      { key: 'CONTRE', v: props.decompte.contre },
      { key: 'ABSTENTION', v: props.decompte.abstentions },
      { key: 'NON_VOTANT', v: props.decompte.nonVotants },
    ] as const
  ).map((s) => ({ ...s, meta: POSITION_META[s.key], pct: (s.v / t) * 100 }))
})
</script>

<template>
  <div>
    <div
      class="flex h-2.5 w-full overflow-hidden rounded-full bg-brand-100"
      role="img"
      :aria-label="`Pour ${decompte.pour}, contre ${decompte.contre}, abstentions ${decompte.abstentions}, non-votants ${decompte.nonVotants}`"
    >
      <div
        v-for="s in segments"
        :key="s.key"
        class="h-full first:rounded-l-full last:rounded-r-full"
        :style="{ width: s.pct + '%', backgroundColor: s.meta.couleur }"
        :title="`${s.meta.label} : ${s.v}`"
      />
    </div>
    <div v-if="showLabels" class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-500">
      <span v-for="s in segments" :key="s.key" class="flex items-center gap-1">
        <span class="inline-block h-2 w-2 rounded-full" :style="{ backgroundColor: s.meta.couleur }" />
        {{ s.meta.label }} <b class="tabular-nums text-brand-700">{{ s.v }}</b>
      </span>
    </div>
  </div>
</template>
