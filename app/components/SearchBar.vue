<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ big?: boolean; placeholder?: string }>(), {
  big: false,
  placeholder: 'Rechercher un scrutin, un député, un groupe…',
})

interface Result { type: string; ref: string; chambre: string; label: string; sub: string }

const query = ref('')
const results = ref<Result[]>([])
const open = ref(false)
const loading = ref(false)
const router = useRouter()
let timer: ReturnType<typeof setTimeout>

const TYPE_LABEL: Record<string, string> = { scrutin: 'Scrutin', elu: 'Élu·e', groupe: 'Groupe' }

watch(query, (q) => {
  clearTimeout(timer)
  if (q.trim().length < 2) {
    results.value = []
    open.value = false
    return
  }
  loading.value = true
  timer = setTimeout(async () => {
    try {
      const r = await $fetch<{ results: Result[] }>('/api/search', { params: { q } })
      results.value = r.results || []
      open.value = true
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 180)
})

function targetOf(r: Result): string {
  if (r.type === 'scrutin') return `/scrutins/${encodeURIComponent(r.ref)}`
  if (r.type === 'groupe') return `/groupes/${encodeURIComponent(r.ref)}`
  return `${r.chambre === 'SENAT' ? '/senateurs' : '/deputes'}/${encodeURIComponent(r.ref)}`
}
function go(r: Result) {
  open.value = false
  query.value = ''
  results.value = []
  router.push(targetOf(r))
}
function onSubmit() {
  if (results.value[0]) go(results.value[0])
}
</script>

<template>
  <div class="relative w-full">
    <form role="search" @submit.prevent="onSubmit">
      <div class="relative">
        <svg
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="query"
          type="search"
          :placeholder="placeholder"
          aria-label="Recherche"
          autocomplete="off"
          class="w-full rounded-full border border-brand-200 bg-white pl-10 pr-4 text-brand-900 placeholder:text-brand-400 focus:border-brand-400 focus:outline-none"
          :class="big ? 'h-13 py-3.5 text-base shadow-sm' : 'h-10 py-2 text-sm'"
          @focus="results.length && (open = true)"
          @blur="setTimeout(() => (open = false), 150)"
        />
      </div>
    </form>

    <div
      v-if="open && (results.length || loading)"
      class="absolute z-40 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-brand-200 bg-white py-1 shadow-lg"
    >
      <p v-if="loading && !results.length" class="px-4 py-3 text-sm text-brand-400">Recherche…</p>
      <button
        v-for="(r, i) in results"
        :key="i"
        type="button"
        class="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-brand-50"
        @mousedown.prevent="go(r)"
      >
        <span class="mt-0.5 shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-500">
          {{ TYPE_LABEL[r.type] || r.type }}
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-brand-900">{{ r.label }}</span>
          <span class="block truncate text-xs text-brand-400">{{ r.sub }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
