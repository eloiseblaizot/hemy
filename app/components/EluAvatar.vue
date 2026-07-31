<script setup lang="ts">
import { ref, computed } from 'vue'
const props = withDefaults(
  defineProps<{ photoUrl?: string | null; prenom?: string; nom?: string; size?: number; couleur?: string }>(),
  { size: 44 },
)
const err = ref(false)
const initials = computed(() =>
  `${(props.prenom || '').charAt(0)}${(props.nom || '').charAt(0)}`.toUpperCase() || '·',
)
const px = computed(() => `${props.size}px`)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-500 ring-2"
    :style="{ width: px, height: px, ['--tw-ring-color' as any]: couleur || 'transparent' }"
  >
    <img
      v-if="photoUrl && !err"
      :src="photoUrl"
      :alt="`${prenom} ${nom}`"
      class="h-full w-full object-cover"
      loading="lazy"
      @error="err = true"
    />
    <span v-else class="text-xs font-semibold">{{ initials }}</span>
  </span>
</template>
