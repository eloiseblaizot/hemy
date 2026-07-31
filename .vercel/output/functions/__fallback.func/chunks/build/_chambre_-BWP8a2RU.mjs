import { _ as __nuxt_component_4 } from './Hemicycle-RgooZaHz.mjs';
import { u as useRoute, c as createError, a as useSeoMeta, _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_3 } from './ScrutinCard-DfH-Ij1V.mjs';
import { defineComponent, computed, withAsyncContext, unref, withCtx, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
import { u as useFetch } from './fetch-oRboePVY.mjs';
import '../_/types.mjs';
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
import './ChambreTag-DX-vVgF7.mjs';
import './VoteBar-Bu3BlcfT.mjs';
import '../_/format.mjs';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[chambre]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const param = computed(() => String(route.params.chambre));
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/chambre/${encodeURIComponent(param.value)}`,
      { key: `chambre-${param.value}` },
      "$zE2KEHdSzm"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: "Chambre inconnue", fatal: true });
    const groupes = computed(() => data.value.groupes);
    const scrutins = computed(() => data.value.scrutins);
    const chambre = computed(() => groupes.value[0]?.chambre || (param.value.includes("senat") ? "SENAT" : "AN"));
    const label = computed(() => chambre.value === "SENAT" ? "Sénat" : "Assemblée nationale");
    const totalMembres = computed(() => groupes.value.reduce((a, g) => a + g.nbMembres, 0));
    const seats = computed(
      () => groupes.value.flatMap(
        (g) => Array.from({ length: g.nbMembres }, () => ({
          position: "POUR",
          couleur: g.couleur,
          ordre: g.ordre,
          groupeCode: g.code,
          groupeLibelle: g.libelle
        }))
      )
    );
    useSeoMeta({ title: () => `${label.value} — scrutins et composition`, description: () => `Composition et derniers scrutins : ${label.value}.` });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Hemicycle = __nuxt_component_4;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ScrutinCard = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(_attrs)}><header class="flex flex-wrap items-end justify-between gap-2"><div><h1 class="text-2xl font-bold text-brand-900 md:text-3xl">${ssrInterpolate(label.value)}</h1><p class="mt-1 text-sm text-brand-500">${ssrInterpolate(totalMembres.value)} sièges · ${ssrInterpolate(unref(data).totalScrutins)} scrutins publics recensés</p></div></header><section class="mt-6 rounded-2xl border border-brand-200/70 bg-white p-5"><h2 class="mb-2 font-bold text-brand-900">Composition</h2><div class="mx-auto max-w-2xl">`);
      _push(ssrRenderComponent(_component_Hemicycle, {
        seats: seats.value,
        mode: "groupe",
        "seat-radius": 7,
        "hide-legend": ""
      }, null, _parent));
      _push(`</div><ul class="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"><!--[-->`);
      ssrRenderList(groupes.value, (g) => {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/groupes/${encodeURIComponent(g.id)}`,
          class: "flex items-center gap-1.5 hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="inline-block h-3 w-3 rounded-full" style="${ssrRenderStyle({ backgroundColor: g.couleur })}"${_scopeId}></span><span class="font-medium text-brand-700"${_scopeId}>${ssrInterpolate(g.code)}</span><span class="tabular-nums text-brand-400"${_scopeId}>${ssrInterpolate(g.nbMembres)}</span>`);
            } else {
              return [
                createVNode("span", {
                  class: "inline-block h-3 w-3 rounded-full",
                  style: { backgroundColor: g.couleur }
                }, null, 4),
                createVNode("span", { class: "font-medium text-brand-700" }, toDisplayString(g.code), 1),
                createVNode("span", { class: "tabular-nums text-brand-400" }, toDisplayString(g.nbMembres), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></section><section class="mt-6"><h2 class="mb-3 font-bold text-brand-900">Derniers scrutins</h2><div class="grid gap-3 sm:grid-cols-2"><!--[-->`);
      ssrRenderList(scrutins.value, (s) => {
        _push(ssrRenderComponent(_component_ScrutinCard, {
          key: s.id,
          scrutin: s
        }, null, _parent));
      });
      _push(`<!--]--></div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chambre/[chambre].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_chambre_-BWP8a2RU.mjs.map
