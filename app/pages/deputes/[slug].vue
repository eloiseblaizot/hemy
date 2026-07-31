<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

// Un slug de sénateur ne doit pas être servi sous /deputes/ : on redirige vers
// la bonne section plutôt que d'afficher une fiche au mauvais endroit.
const { data } = await useFetch(() => `/api/elus/${encodeURIComponent(slug.value)}`, { key: `elu-chk-${slug.value}` })
if (data.value?.elu?.chambre === 'SENAT') {
  await navigateTo(`/senateurs/${encodeURIComponent(slug.value)}`, { redirectCode: 301 })
}
</script>

<template>
  <div>
    <NuxtLink to="/chambre/assemblee-nationale" class="text-sm text-brand-400 hover:text-brand-700">← Assemblée nationale</NuxtLink>
    <div class="mt-3">
      <EluProfile :slug="slug" />
    </div>
  </div>
</template>
