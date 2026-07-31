<script setup lang="ts">
import { ref, computed } from 'vue'

const { data: depsData } = await useFetch('/api/departements', { key: 'departements' })
const departements = computed(() => depsData.value?.items ?? [])

const selected = ref('')
const depElus = ref<any[]>([])
const loadingDep = ref(false)
watch(selected, async (code) => {
  if (!code) {
    depElus.value = []
    return
  }
  loadingDep.value = true
  try {
    const r = await $fetch<{ elus: any[] }>(`/api/departements/${encodeURIComponent(code)}`)
    depElus.value = r.elus
  } finally {
    loadingDep.value = false
  }
})

const { ids } = useMesElus()
const mine = ref<any[]>([])
async function loadMine() {
  if (!ids.value.length) {
    mine.value = []
    return
  }
  const r = await $fetch<{ items: any[] }>('/api/elus', { params: { ids: ids.value.join(',') } })
  // conserve l'ordre : AN puis Sénat, déjà trié côté API
  mine.value = r.items
}
onMounted(() => watch(ids, loadMine, { immediate: true }))

useSeoMeta({ title: 'Mes élus', description: 'Suivez vos députés et sénateurs et leurs votes.' })
</script>

<template>
  <div>
    <header>
      <h1 class="text-2xl font-bold text-brand-900 md:text-3xl">Mes élus</h1>
      <p class="mt-1 max-w-2xl text-sm text-brand-500">
        Sélectionnez votre département pour trouver vos députés et sénateurs, puis suivez-les avec l'étoile. Votre sélection
        est enregistrée sur cet appareil (aucun compte requis).
      </p>
    </header>

    <!-- Mes élus suivis -->
    <ClientOnly>
      <section class="mt-6">
        <h2 class="mb-3 font-bold text-brand-900">Suivis</h2>
        <div v-if="mine.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <EluCard v-for="e in mine" :key="e.id" :elu="e" />
        </div>
        <p v-else class="rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-brand-400">
          Vous ne suivez encore aucun élu. Ajoutez-en depuis la liste ci-dessous.
        </p>
      </section>
      <template #fallback>
        <section class="mt-6">
          <h2 class="mb-3 font-bold text-brand-900">Suivis</h2>
          <p class="rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-brand-400">Chargement…</p>
        </section>
      </template>
    </ClientOnly>

    <!-- Recherche par département -->
    <section class="mt-8">
      <h2 class="mb-3 font-bold text-brand-900">Trouver par département</h2>
      <select
        v-model="selected"
        class="w-full max-w-sm rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none"
      >
        <option value="">— Choisir un département —</option>
        <option v-for="d in departements" :key="d.code" :value="d.code">
          {{ d.nom }} ({{ d.an }} député{{ d.an > 1 ? 's' : '' }} · {{ d.senat }} sénateur{{ d.senat > 1 ? 's' : '' }})
        </option>
      </select>

      <div v-if="loadingDep" class="mt-4 text-sm text-brand-400">Chargement…</div>
      <div v-else-if="depElus.length" class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <EluCard v-for="e in depElus" :key="e.id" :elu="e" />
      </div>
    </section>
  </div>
</template>
