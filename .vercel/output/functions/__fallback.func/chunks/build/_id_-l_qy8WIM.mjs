import { u as useRoute, b as useRouter, c as createError, a as useSeoMeta, _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1 } from './ChambreTag-DX-vVgF7.mjs';
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from './VoteBar-Bu3BlcfT.mjs';
import { _ as __nuxt_component_4 } from './Hemicycle-RgooZaHz.mjs';
import { _ as __nuxt_component_5 } from './GroupePill-B8YRnj0I.mjs';
import { _ as __nuxt_component_6 } from './PositionBadge-BnsNiJ52.mjs';
import { defineComponent, computed, withAsyncContext, ref, withCtx, createTextVNode, unref, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderStyle, ssrRenderClass } from 'vue/server-renderer';
import { f as formatDate } from '../_/format.mjs';
import { P as POSITION_META } from '../_/types.mjs';
import { u as useFetch } from './fetch-oRboePVY.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'vue-router';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const router = useRouter();
    const id = computed(() => String(route.params.id));
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/scrutins/${encodeURIComponent(id.value)}`,
      { key: `scrutin-${id.value}` },
      "$Ab8yarh0Fh"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (error.value || !data.value) {
      throw createError({ statusCode: 404, statusMessage: "Scrutin introuvable", fatal: true });
    }
    const scrutin = computed(() => data.value.scrutin);
    const groupes = computed(() => data.value.groupes);
    const sieges = computed(() => data.value.sieges);
    const decompte = computed(() => ({
      pour: scrutin.value.pour,
      contre: scrutin.value.contre,
      abstentions: scrutin.value.abstentions,
      nonVotants: scrutin.value.nonVotants
    }));
    const mode = ref("position");
    const ORD = { POUR: 0, CONTRE: 1, ABSTENTION: 2, NON_VOTANT: 3 };
    const parGroupe = computed(() => {
      const map = /* @__PURE__ */ new Map();
      for (const s of sieges.value) {
        const key = s.groupeId || "na";
        if (!map.has(key)) map.set(key, { code: s.groupeCode || "—", libelle: s.groupeLibelle || "Sans groupe", couleur: s.couleur || "#9AA5B1", ordre: s.ordre ?? 99, membres: [] });
        map.get(key).membres.push(s);
      }
      for (const g of map.values()) g.membres.sort((a, b) => ORD[a.position] - ORD[b.position] || a.nom.localeCompare(b.nom, "fr"));
      return [...map.values()].sort((a, b) => a.ordre - b.ordre);
    });
    function eluLink(s) {
      if (!s.slug) return null;
      return `${scrutin.value.chambre === "SENAT" ? "/senateurs" : "/deputes"}/${encodeURIComponent(s.slug)}`;
    }
    function onSeat(s) {
      const l = eluLink(s);
      if (l) router.push(l);
    }
    useSeoMeta({
      title: () => `${scrutin.value.titre?.slice(0, 70)} — Scrutin`,
      description: () => `Scrutin n°${scrutin.value.numero} : ${scrutin.value.pour} pour, ${scrutin.value.contre} contre.`
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ChambreTag = __nuxt_component_1;
      const _component_SortBadge = __nuxt_component_2;
      const _component_VoteBar = __nuxt_component_3;
      const _component_Hemicycle = __nuxt_component_4;
      const _component_GroupePill = __nuxt_component_5;
      const _component_PositionBadge = __nuxt_component_6;
      if (scrutin.value) {
        _push(`<div${ssrRenderAttrs(_attrs)}>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "text-sm text-brand-400 hover:text-brand-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← Accueil`);
            } else {
              return [
                createTextVNode("← Accueil")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<header class="mt-3"><div class="flex flex-wrap items-center gap-2 text-sm text-brand-400">`);
        _push(ssrRenderComponent(_component_ChambreTag, {
          chambre: scrutin.value.chambre
        }, null, _parent));
        _push(`<span>Scrutin n°${ssrInterpolate(scrutin.value.numero)}</span><span aria-hidden="true">·</span><span>${ssrInterpolate(unref(formatDate)(scrutin.value.date))}</span>`);
        _push(ssrRenderComponent(_component_SortBadge, {
          sort: scrutin.value.sortCode
        }, null, _parent));
        _push(`</div><h1 class="mt-2 text-xl font-bold leading-snug text-brand-900 md:text-2xl">${ssrInterpolate(scrutin.value.titre)}</h1>`);
        if (scrutin.value.demandeur) {
          _push(`<p class="mt-1 text-sm text-brand-500">Demandé par : ${ssrInterpolate(scrutin.value.demandeur)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</header><section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5"><div class="grid grid-cols-2 gap-3 sm:grid-cols-4"><!--[-->`);
        ssrRenderList(["POUR", "CONTRE", "ABSTENTION", "NON_VOTANT"], (p) => {
          _push(`<div class="rounded-xl bg-brand-50 p-3 text-center"><div class="text-2xl font-bold tabular-nums" style="${ssrRenderStyle({ color: unref(POSITION_META)[p].couleur })}">${ssrInterpolate(p === "POUR" ? scrutin.value.pour : p === "CONTRE" ? scrutin.value.contre : p === "ABSTENTION" ? scrutin.value.abstentions : scrutin.value.nonVotants)}</div><div class="text-xs font-medium text-brand-500">${ssrInterpolate(unref(POSITION_META)[p].label)}</div></div>`);
        });
        _push(`<!--]--></div><div class="mt-4">`);
        _push(ssrRenderComponent(_component_VoteBar, { decompte: decompte.value }, null, _parent));
        _push(`</div><p class="mt-2 text-xs text-brand-400">${ssrInterpolate(scrutin.value.nombreVotants)} votants · ${ssrInterpolate(scrutin.value.suffragesExprimes)} suffrages exprimés`);
        if (scrutin.value.nbrSuffragesRequis) {
          _push(`<!--[--> · majorité requise ${ssrInterpolate(scrutin.value.nbrSuffragesRequis)}<!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p></section><section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5"><div class="mb-2 flex items-center justify-between"><h2 class="font-bold text-brand-900">Hémicycle</h2><div class="flex rounded-full bg-brand-100 p-0.5 text-xs font-medium"><button class="${ssrRenderClass([mode.value === "position" ? "bg-white text-brand-900 shadow-sm" : "text-brand-500", "rounded-full px-3 py-1 transition"])}">Par vote</button><button class="${ssrRenderClass([mode.value === "groupe" ? "bg-white text-brand-900 shadow-sm" : "text-brand-500", "rounded-full px-3 py-1 transition"])}">Par groupe</button></div></div>`);
        _push(ssrRenderComponent(_component_Hemicycle, {
          seats: sieges.value,
          mode: mode.value,
          onSeatClick: onSeat
        }, null, _parent));
        _push(`</section><section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5"><h2 class="mb-3 font-bold text-brand-900">Par groupe</h2><div class="space-y-2"><!--[-->`);
        ssrRenderList(groupes.value, (g) => {
          _push(`<div class="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-brand-100 pb-2 last:border-0">`);
          _push(ssrRenderComponent(_component_GroupePill, { groupe: g }, null, _parent));
          _push(ssrRenderComponent(_component_VoteBar, {
            decompte: { pour: g.pour, contre: g.contre, abstentions: g.abstentions, nonVotants: g.nonVotants }
          }, null, _parent));
          _push(`<span class="whitespace-nowrap text-xs tabular-nums text-brand-500"><b class="text-pour">${ssrInterpolate(g.pour)}</b> / <b class="text-contre">${ssrInterpolate(g.contre)}</b> / ${ssrInterpolate(g.abstentions)} / ${ssrInterpolate(g.nonVotants)}</span></div>`);
        });
        _push(`<!--]--></div></section><section class="mt-6"><h2 class="mb-3 font-bold text-brand-900">Détail nominatif</h2><div class="space-y-2"><!--[-->`);
        ssrRenderList(parGroupe.value, (g) => {
          _push(`<details class="overflow-hidden rounded-xl border border-brand-200/70 bg-white"><summary class="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-brand-800"><span class="inline-block h-3 w-3 rounded-full" style="${ssrRenderStyle({ backgroundColor: g.couleur })}"></span> ${ssrInterpolate(g.code)} <span class="font-normal text-brand-400">· ${ssrInterpolate(g.membres.length)} votant·es</span></summary><ul class="divide-y divide-brand-100 border-t border-brand-100"><!--[-->`);
          ssrRenderList(g.membres, (m, i) => {
            _push(`<li class="flex items-center justify-between gap-3 px-4 py-2">`);
            if (eluLink(m)) {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: eluLink(m),
                class: "min-w-0 truncate text-sm text-brand-800 hover:text-brand-950 hover:underline"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`${ssrInterpolate((m.prenom + " " + m.nom).trim() || "Élu")}`);
                  } else {
                    return [
                      createTextVNode(toDisplayString((m.prenom + " " + m.nom).trim() || "Élu"), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else {
              _push(`<span class="min-w-0 truncate text-sm text-brand-500">${ssrInterpolate((m.prenom + " " + m.nom).trim() || "Élu")}</span>`);
            }
            _push(ssrRenderComponent(_component_PositionBadge, {
              position: m.position,
              cause: m.cause,
              "par-delegation": m.parDelegation
            }, null, _parent));
            _push(`</li>`);
          });
          _push(`<!--]--></ul></details>`);
        });
        _push(`<!--]--></div></section></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/scrutins/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-l_qy8WIM.mjs.map
