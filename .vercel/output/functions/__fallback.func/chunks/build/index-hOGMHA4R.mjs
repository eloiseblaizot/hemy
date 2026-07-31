import { _ as __nuxt_component_1 } from './SearchBar-CBcL1CVJ.mjs';
import { a as useSeoMeta, _ as __nuxt_component_0 } from './server.mjs';
import { u as useFetch, _ as __nuxt_component_2 } from './fetch-oRboePVY.mjs';
import { _ as __nuxt_component_3 } from './ScrutinCard-DfH-Ij1V.mjs';
import { defineComponent, withAsyncContext, withCtx, createTextVNode, createVNode, unref, openBlock, createBlock, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
import { u as useMesElus } from './useMesElus-DfnSS5if.mjs';
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
import './ChambreTag-DX-vVgF7.mjs';
import '../_/types.mjs';
import './VoteBar-Bu3BlcfT.mjs';
import '../_/format.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: an } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/scrutins",
      { key: "home-an", query: { chambre: "AN", limit: 6 } },
      "$gLr7P_Wiiw"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: senat } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/scrutins",
      { key: "home-senat", query: { chambre: "SENAT", limit: 6 } },
      "$sAG6k9d1bw"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { ids } = useMesElus();
    useSeoMeta({
      title: "Hemy — les votes à l'Assemblée nationale et au Sénat",
      description: "Suivez les scrutins publics de l'Assemblée nationale et du Sénat, visualisés par hémicycle et par groupe, et gardez un œil sur vos députés et sénateurs."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SearchBar = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ClientOnly = __nuxt_component_2;
      const _component_ScrutinCard = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(_attrs)}><section class="rounded-2xl bg-brand-900 px-6 py-10 text-center text-white md:py-14"><h1 class="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-4xl"> Comment votent l&#39;Assemblée nationale et le Sénat </h1><p class="mx-auto mt-3 max-w-xl text-brand-200"> Chaque scrutin public, visualisé siège par siège et groupe par groupe. Suivez vos élus. </p><div class="mx-auto mt-6 max-w-2xl">`);
      _push(ssrRenderComponent(_component_SearchBar, { big: "" }, null, _parent));
      _push(`</div><div class="mt-4 flex flex-wrap justify-center gap-2 text-sm">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/chambre/assemblee-nationale",
        class: "rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Assemblée nationale `);
          } else {
            return [
              createTextVNode(" Assemblée nationale ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/chambre/senat",
        class: "rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Sénat `);
          } else {
            return [
              createTextVNode(" Sénat ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/mes-elus",
        class: "rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ★ Mes élus `);
            _push2(ssrRenderComponent(_component_ClientOnly, null, {}, _parent2, _scopeId));
          } else {
            return [
              createTextVNode(" ★ Mes élus "),
              createVNode(_component_ClientOnly, null, {
                default: withCtx(() => [
                  unref(ids).length ? (openBlock(), createBlock("span", {
                    key: 0,
                    class: "opacity-80"
                  }, "(" + toDisplayString(unref(ids).length) + ")", 1)) : createCommentVNode("", true)
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></section><section class="mt-8 grid gap-6 md:mt-10 md:grid-cols-2"><div><div class="mb-3 flex items-center justify-between"><h2 class="text-lg font-bold text-brand-900">Derniers scrutins · Assemblée</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/chambre/assemblee-nationale",
        class: "text-sm font-medium text-brand-500 hover:text-brand-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Tout voir →`);
          } else {
            return [
              createTextVNode("Tout voir →")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(an)?.items || [], (s) => {
        _push(ssrRenderComponent(_component_ScrutinCard, {
          key: s.id,
          scrutin: s
        }, null, _parent));
      });
      _push(`<!--]--></div></div><div><div class="mb-3 flex items-center justify-between"><h2 class="text-lg font-bold text-brand-900">Derniers scrutins · Sénat</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/chambre/senat",
        class: "text-sm font-medium text-brand-500 hover:text-brand-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Tout voir →`);
          } else {
            return [
              createTextVNode("Tout voir →")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(senat)?.items || [], (s) => {
        _push(ssrRenderComponent(_component_ScrutinCard, {
          key: s.id,
          scrutin: s
        }, null, _parent));
      });
      _push(`<!--]--></div></div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-hOGMHA4R.mjs.map
