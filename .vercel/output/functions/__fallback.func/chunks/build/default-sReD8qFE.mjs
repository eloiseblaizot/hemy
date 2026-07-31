import { _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1 } from './SearchBar-CBcL1CVJ.mjs';
import { defineComponent, withAsyncContext, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot, ssrRenderClass } from 'vue/server-renderer';
import { f as formatDate } from '../_/format.mjs';
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
  __name: "default",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const links = [
      { to: "/", label: "Accueil", exact: true },
      { to: "/chambre/assemblee-nationale", label: "Assemblée" },
      { to: "/chambre/senat", label: "Sénat" },
      { to: "/mes-elus", label: "Mes élus" }
    ];
    const { data: fraicheur } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/fraicheur",
      { key: "fraicheur" },
      "$3CUUyrqDAM"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_SearchBar = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen flex-col" }, _attrs))}><header class="sticky top-0 z-30 border-b border-brand-200/70 bg-white/85 backdrop-blur"><div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex shrink-0 items-center gap-2",
        "aria-label": "Hemy — accueil"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg viewBox="0 0 40 22" class="h-6 w-11" aria-hidden="true"${_scopeId}><g${_scopeId}><circle cx="6" cy="18" r="2.4" fill="#C00D0D"${_scopeId}></circle><circle cx="11" cy="10" r="2.4" fill="#E4526A"${_scopeId}></circle><circle cx="20" cy="6" r="2.4" fill="#F07E26"${_scopeId}></circle><circle cx="29" cy="10" r="2.4" fill="#3B6FB0"${_scopeId}></circle><circle cx="34" cy="18" r="2.4" fill="#12386E"${_scopeId}></circle></g></svg><span class="text-lg font-bold tracking-tight text-brand-900"${_scopeId}>Hemy</span>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                viewBox: "0 0 40 22",
                class: "h-6 w-11",
                "aria-hidden": "true"
              }, [
                createVNode("g", null, [
                  createVNode("circle", {
                    cx: "6",
                    cy: "18",
                    r: "2.4",
                    fill: "#C00D0D"
                  }),
                  createVNode("circle", {
                    cx: "11",
                    cy: "10",
                    r: "2.4",
                    fill: "#E4526A"
                  }),
                  createVNode("circle", {
                    cx: "20",
                    cy: "6",
                    r: "2.4",
                    fill: "#F07E26"
                  }),
                  createVNode("circle", {
                    cx: "29",
                    cy: "10",
                    r: "2.4",
                    fill: "#3B6FB0"
                  }),
                  createVNode("circle", {
                    cx: "34",
                    cy: "18",
                    r: "2.4",
                    fill: "#12386E"
                  })
                ])
              ])),
              createVNode("span", { class: "text-lg font-bold tracking-tight text-brand-900" }, "Hemy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="ml-auto hidden max-w-md flex-1 md:block">`);
      _push(ssrRenderComponent(_component_SearchBar, null, null, _parent));
      _push(`</div><nav class="hidden items-center gap-1 md:flex"><!--[-->`);
      ssrRenderList(links, (l) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: l.to,
          to: l.to,
          class: "rounded-full px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-900",
          "active-class": "!bg-brand-900 !text-white"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(l.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(l.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav></div><div class="mx-auto max-w-6xl px-4 pb-3 md:hidden">`);
      _push(ssrRenderComponent(_component_SearchBar, null, null, _parent));
      _push(`<nav class="mt-2 flex gap-1 overflow-x-auto"><!--[-->`);
      ssrRenderList(links, (l) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: l.to,
          to: l.to,
          class: "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100",
          "active-class": "!bg-brand-900 !text-white"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(l.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(l.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav></div></header><main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main><footer class="border-t border-brand-200/70 bg-white"><div class="mx-auto max-w-6xl px-4 py-8 text-sm text-brand-500"><p class="font-semibold text-brand-700">Hemy</p><p class="mt-1 max-w-2xl"> Visualisation des scrutins publics de l&#39;Assemblée nationale et du Sénat. Site indépendant, non officiel. </p>`);
      if (unref(fraicheur)?.derniereMaj) {
        _push(`<p class="mt-2 flex items-center gap-1.5 text-xs"><span class="${ssrRenderClass([unref(fraicheur).obsolete ? "bg-abstention" : "bg-pour", "inline-block h-1.5 w-1.5 rounded-full"])}"></span> Données mises à jour le ${ssrInterpolate(unref(formatDate)(unref(fraicheur).derniereMaj, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }))} `);
        if (unref(fraicheur).obsolete) {
          _push(`<span class="text-abstention">— la mise à jour automatique semble interrompue</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-3 text-xs"> Données : <a class="underline hover:text-brand-700" href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener"> open data de l&#39;Assemblée nationale </a> et <a class="underline hover:text-brand-700" href="https://data.senat.fr" target="_blank" rel="noopener"> open data du Sénat </a> — sous <a class="underline hover:text-brand-700" href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener"> Licence Ouverte / Etalab </a>. </p></div></footer></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=default-sReD8qFE.mjs.map
