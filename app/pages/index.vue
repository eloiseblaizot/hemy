<script setup lang="ts">
const { data: an } = await useFetch('/api/scrutins', { key: 'home-an', query: { chambre: 'AN', limit: 6 } })
const { data: senat } = await useFetch('/api/scrutins', { key: 'home-senat', query: { chambre: 'SENAT', limit: 6 } })
const { ids } = useMesElus()

useSeoMeta({
  title: "Hemy — les votes à l'Assemblée nationale et au Sénat",
  description:
    "Suivez les scrutins publics de l'Assemblée nationale et du Sénat, visualisés par hémicycle et par groupe, et gardez un œil sur vos députés et sénateurs.",
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="rounded-2xl bg-brand-900 px-6 py-10 text-center text-white md:py-14">
      <h1 class="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
        Comment votent l'Assemblée&nbsp;nationale et le&nbsp;Sénat
      </h1>
      <p class="mx-auto mt-3 max-w-xl text-brand-200">
        Chaque scrutin public, visualisé siège par siège et groupe par groupe. Suivez vos élus.
      </p>
      <div class="mx-auto mt-6 max-w-2xl">
        <SearchBar big />
      </div>
      <div class="mt-4 flex flex-wrap justify-center gap-2 text-sm">
        <NuxtLink to="/chambre/assemblee-nationale" class="rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20">
          Assemblée nationale
        </NuxtLink>
        <NuxtLink to="/chambre/senat" class="rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20">
          Sénat
        </NuxtLink>
        <NuxtLink to="/mes-elus" class="rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20">
          ★ Mes élus <ClientOnly><span v-if="ids.length" class="opacity-80">({{ ids.length }})</span></ClientOnly>
        </NuxtLink>
      </div>
    </section>

    <!-- Derniers scrutins -->
    <section class="mt-8 grid gap-6 md:mt-10 md:grid-cols-2">
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-bold text-brand-900">Derniers scrutins · Assemblée</h2>
          <NuxtLink to="/chambre/assemblee-nationale" class="text-sm font-medium text-brand-500 hover:text-brand-900">Tout voir →</NuxtLink>
        </div>
        <div class="space-y-3">
          <ScrutinCard v-for="s in an?.items || []" :key="s.id" :scrutin="s" />
        </div>
      </div>
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-bold text-brand-900">Derniers scrutins · Sénat</h2>
          <NuxtLink to="/chambre/senat" class="text-sm font-medium text-brand-500 hover:text-brand-900">Tout voir →</NuxtLink>
        </div>
        <div class="space-y-3">
          <ScrutinCard v-for="s in senat?.items || []" :key="s.id" :scrutin="s" />
        </div>
      </div>
    </section>
  </div>
</template>
