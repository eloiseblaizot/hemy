<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

// Symétrique de /deputes/[slug] : un slug de député est redirigé.
const { data } = await useFetch(() => `/api/elus/${encodeURIComponent(slug.value)}`, { key: `elu-chk-${slug.value}` })
if (data.value?.elu?.chambre === 'AN') {
  await navigateTo(`/deputes/${encodeURIComponent(slug.value)}`, { redirectCode: 301 })
}
</script>

<template>
  <div>
    <NuxtLink to="/chambre/senat" class="text-sm text-brand-400 hover:text-brand-700">← Sénat</NuxtLink>
    <div class="mt-3">
      <EluProfile :slug="slug" />
    </div>
  </div>
</template>
