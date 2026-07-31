<script setup lang="ts">
import { computed } from 'vue'
import { CHAMBRE_META, type Chambre } from '#shared/types'

const props = withDefaults(defineProps<{ chambre: string; short?: boolean }>(), { short: false })
const meta = computed(() => CHAMBRE_META[props.chambre as Chambre])
const dot = computed(() => (props.chambre === 'AN' ? '#3a4f78' : '#8a6d3b'))
</script>

<template>
  <span
    v-if="meta"
    class="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: dot }" />
    {{ short ? meta.labelCourt : meta.label }}
  </span>
</template>
