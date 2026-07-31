<script setup lang="ts">
import { formatDate } from '#shared/format'
defineProps<{ scrutin: any }>()
</script>

<template>
  <NuxtLink
    :to="`/scrutins/${encodeURIComponent(scrutin.id)}`"
    class="block rounded-xl border border-brand-200/70 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-400">
        <ChambreTag :chambre="scrutin.chambre" short />
        <span>n°{{ scrutin.numero }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ formatDate(scrutin.date, { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
      </div>
      <SortBadge :sort="scrutin.sortCode" />
    </div>

    <p class="mt-2 line-clamp-2 text-sm font-medium leading-snug text-brand-900">
      {{ scrutin.titre }}
    </p>

    <div class="mt-3">
      <VoteBar
        :decompte="{
          pour: scrutin.pour,
          contre: scrutin.contre,
          abstentions: scrutin.abstentions,
          nonVotants: scrutin.nonVotants,
        }"
      />
    </div>
    <div class="mt-1.5 flex justify-between text-xs text-brand-400">
      <span><b class="text-pour">{{ scrutin.pour }}</b> pour · <b class="text-contre">{{ scrutin.contre }}</b> contre</span>
      <span>{{ scrutin.nombreVotants }} votants</span>
    </div>
  </NuxtLink>
</template>
