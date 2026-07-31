<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)

useSeoMeta({ title: () => (is404.value ? 'Page introuvable — Hemy' : 'Erreur — Hemy') })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-brand-50">
    <main class="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <svg viewBox="0 0 40 22" class="h-10 w-20" aria-hidden="true">
        <circle cx="6" cy="18" r="2.4" fill="#C00D0D" />
        <circle cx="11" cy="10" r="2.4" fill="#E4526A" />
        <circle cx="20" cy="6" r="2.4" fill="#F07E26" />
        <circle cx="29" cy="10" r="2.4" fill="#3B6FB0" />
        <circle cx="34" cy="18" r="2.4" fill="#12386E" />
      </svg>

      <p class="mt-6 text-5xl font-bold tabular-nums text-brand-300">{{ error?.statusCode || 500 }}</p>
      <h1 class="mt-2 text-2xl font-bold text-brand-900">
        {{ is404 ? 'Cette page n’existe pas' : 'Une erreur est survenue' }}
      </h1>
      <p class="mt-2 max-w-md text-brand-500">
        {{
          is404
            ? 'Le scrutin, l’élu ou le groupe demandé est introuvable. Il a peut-être changé d’adresse.'
            : 'Le service a rencontré un problème. Vous pouvez réessayer dans un instant.'
        }}
      </p>

      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <NuxtLink to="/" class="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700">
          Retour à l’accueil
        </NuxtLink>
        <NuxtLink to="/chambre/assemblee-nationale" class="rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100">
          Derniers scrutins
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
