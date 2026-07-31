<script setup lang="ts">
import { formatDate } from '#shared/format'

const links = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/chambre/assemblee-nationale', label: 'Assemblée' },
  { to: '/chambre/senat', label: 'Sénat' },
  { to: '/mes-elus', label: 'Mes élus' },
]

const { data: fraicheur } = await useFetch('/api/fraicheur', { key: 'fraicheur' })
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-30 border-b border-brand-200/70 bg-white/85 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2" aria-label="Hemy — accueil">
          <svg viewBox="0 0 40 22" class="h-6 w-11" aria-hidden="true">
            <g>
              <circle cx="6" cy="18" r="2.4" fill="#C00D0D" />
              <circle cx="11" cy="10" r="2.4" fill="#E4526A" />
              <circle cx="20" cy="6" r="2.4" fill="#F07E26" />
              <circle cx="29" cy="10" r="2.4" fill="#3B6FB0" />
              <circle cx="34" cy="18" r="2.4" fill="#12386E" />
            </g>
          </svg>
          <span class="text-lg font-bold tracking-tight text-brand-900">Hemy</span>
        </NuxtLink>

        <div class="ml-auto hidden max-w-md flex-1 md:block">
          <SearchBar />
        </div>

        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="rounded-full px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-900"
            active-class="!bg-brand-900 !text-white"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Mobile : recherche + nav -->
      <div class="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <SearchBar />
        <nav class="mt-2 flex gap-1 overflow-x-auto">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100"
            active-class="!bg-brand-900 !text-white"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">
      <slot />
    </main>

    <footer class="border-t border-brand-200/70 bg-white">
      <div class="mx-auto max-w-6xl px-4 py-8 text-sm text-brand-500">
        <p class="font-semibold text-brand-700">Hemy</p>
        <p class="mt-1 max-w-2xl">
          Visualisation des scrutins publics de l'Assemblée nationale et du Sénat. Site indépendant, non officiel.
        </p>
        <p v-if="fraicheur?.derniereMaj" class="mt-2 flex items-center gap-1.5 text-xs">
          <span
            class="inline-block h-1.5 w-1.5 rounded-full"
            :class="fraicheur.obsolete ? 'bg-abstention' : 'bg-pour'"
          />
          Données mises à jour le {{ formatDate(fraicheur.derniereMaj, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
          <span v-if="fraicheur.obsolete" class="text-abstention">— la mise à jour automatique semble interrompue</span>
        </p>
        <p class="mt-3 text-xs">
          Données :
          <a class="underline hover:text-brand-700" href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener">
            open data de l'Assemblée nationale
          </a>
          et
          <a class="underline hover:text-brand-700" href="https://data.senat.fr" target="_blank" rel="noopener">
            open data du Sénat
          </a>
          — sous
          <a class="underline hover:text-brand-700" href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener">
            Licence Ouverte / Etalab
          </a>.
        </p>
      </div>
    </footer>
  </div>
</template>
