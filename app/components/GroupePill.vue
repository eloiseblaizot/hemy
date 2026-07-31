<script setup lang="ts">
defineProps<{
  groupe: { id: string; code: string; couleur: string; libelle?: string } | null
  link?: boolean
}>()
</script>

<template>
  <component
    :is="link !== false && groupe ? resolveComponent('NuxtLink') : 'span'"
    v-if="groupe"
    :to="link !== false ? `/groupes/${encodeURIComponent(groupe.id)}` : undefined"
    class="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-white px-2 py-0.5 text-xs font-medium text-brand-700"
    :class="link !== false ? 'transition-colors hover:bg-brand-50' : ''"
    :title="groupe.libelle"
  >
    <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: groupe.couleur }" />
    {{ groupe.code }}
  </component>
</template>
