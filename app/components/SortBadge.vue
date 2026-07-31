<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ sort: string }>()
const adopte = computed(() => props.sort?.toLowerCase().includes('adopt'))
const label = computed(() => (adopte.value ? 'Adopté' : 'Rejeté'))
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="adopte ? 'bg-pour-soft text-pour' : 'bg-contre-soft text-contre'"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full" :class="adopte ? 'bg-pour' : 'bg-contre'" />
    {{ label }}
  </span>
</template>
