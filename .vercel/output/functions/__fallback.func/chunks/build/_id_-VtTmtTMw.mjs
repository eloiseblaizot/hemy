import { u as useRoute, c as createError, a as useSeoMeta, _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1 } from './ChambreTag-DX-vVgF7.mjs';
import { _ as __nuxt_component_1$1 } from './EluCard-3d4aWazQ.mjs';
import { defineComponent, computed, withAsyncContext, withCtx, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderList } from 'vue/server-renderer';
import { C as CHAMBRE_META } from '../_/types.mjs';
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
import './EluAvatar-BUYpBatK.mjs';
import './GroupePill-B8YRnj0I.mjs';
import './useMesElus-DfnSS5if.mjs';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const id = computed(() => String(route.params.id));
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/groupes/${encodeURIComponent(id.value)}`,
      { key: `groupe-${id.value}` },
      "$zUMAearC66"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: "Groupe introuvable", fatal: true });
    const groupe = computed(() => data.value.groupe);
    const membres = computed(() => data.value.membres);
    useSeoMeta({ title: () => `${groupe.value.libelle} — groupe`, description: () => `Membres et informations du groupe ${groupe.value.libelle}.` });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ChambreTag = __nuxt_component_1;
      const _component_EluCard = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/chambre/${groupe.value.chambre === "SENAT" ? "senat" : "assemblee-nationale"}`,
        class: "text-sm text-brand-400 hover:text-brand-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ← ${ssrInterpolate(unref(CHAMBRE_META)[groupe.value.chambre]?.label)}`);
          } else {
            return [
              createTextVNode(" ← " + toDisplayString(unref(CHAMBRE_META)[groupe.value.chambre]?.label), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<header class="mt-3 overflow-hidden rounded-2xl border border-brand-200/70 bg-white"><div class="h-2" style="${ssrRenderStyle({ backgroundColor: groupe.value.couleur })}"></div><div class="flex items-center gap-4 p-5"><span class="inline-block h-10 w-10 shrink-0 rounded-full" style="${ssrRenderStyle({ backgroundColor: groupe.value.couleur })}"></span><div><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(_component_ChambreTag, {
        chambre: groupe.value.chambre
      }, null, _parent));
      _push(`<span class="text-xs font-semibold uppercase tracking-wide text-brand-400">${ssrInterpolate(groupe.value.code)}</span></div><h1 class="mt-1 text-xl font-bold text-brand-900 md:text-2xl">${ssrInterpolate(groupe.value.libelle)}</h1><p class="text-sm text-brand-500">${ssrInterpolate(unref(data).nbMembres)} membres</p></div></div></header><section class="mt-6"><h2 class="mb-3 font-bold text-brand-900">Membres</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      ssrRenderList(membres.value, (e) => {
        _push(ssrRenderComponent(_component_EluCard, {
          key: e.id,
          elu: { ...e, chambre: groupe.value.chambre, groupe: groupe.value }
        }, null, _parent));
      });
      _push(`<!--]--></div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/groupes/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-VtTmtTMw.mjs.map
