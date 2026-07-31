import { u as useFetch, _ as __nuxt_component_2 } from './fetch-oRboePVY.mjs';
import { _ as __nuxt_component_1 } from './EluCard-3d4aWazQ.mjs';
import { defineComponent, withAsyncContext, computed, ref, watch, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { u as useMesElus } from './useMesElus-DfnSS5if.mjs';
import { a as useSeoMeta } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@vue/shared';
import 'perfect-debounce';
import './EluAvatar-BUYpBatK.mjs';
import './GroupePill-B8YRnj0I.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "mes-elus",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: depsData } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/departements",
      { key: "departements" },
      "$TnWM9s4tt2"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const departements = computed(() => depsData.value?.items ?? []);
    const selected = ref("");
    const depElus = ref([]);
    const loadingDep = ref(false);
    watch(selected, async (code) => {
      if (!code) {
        depElus.value = [];
        return;
      }
      loadingDep.value = true;
      try {
        const r = await $fetch(`/api/departements/${encodeURIComponent(code)}`);
        depElus.value = r.elus;
      } finally {
        loadingDep.value = false;
      }
    });
    useMesElus();
    ref([]);
    useSeoMeta({ title: "Mes élus", description: "Suivez vos députés et sénateurs et leurs votes." });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_2;
      const _component_EluCard = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(_attrs)}><header><h1 class="text-2xl font-bold text-brand-900 md:text-3xl">Mes élus</h1><p class="mt-1 max-w-2xl text-sm text-brand-500"> Sélectionnez votre département pour trouver vos députés et sénateurs, puis suivez-les avec l&#39;étoile. Votre sélection est enregistrée sur cet appareil (aucun compte requis). </p></header>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<section class="mt-6"${_scopeId}><h2 class="mb-3 font-bold text-brand-900"${_scopeId}>Suivis</h2><p class="rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-brand-400"${_scopeId}>Chargement…</p></section>`);
          } else {
            return [
              createVNode("section", { class: "mt-6" }, [
                createVNode("h2", { class: "mb-3 font-bold text-brand-900" }, "Suivis"),
                createVNode("p", { class: "rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-brand-400" }, "Chargement…")
              ])
            ];
          }
        })
      }, _parent));
      _push(`<section class="mt-8"><h2 class="mb-3 font-bold text-brand-900">Trouver par département</h2><select class="w-full max-w-sm rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(selected.value) ? ssrLooseContain(selected.value, "") : ssrLooseEqual(selected.value, "")) ? " selected" : ""}>— Choisir un département —</option><!--[-->`);
      ssrRenderList(departements.value, (d) => {
        _push(`<option${ssrRenderAttr("value", d.code)}${ssrIncludeBooleanAttr(Array.isArray(selected.value) ? ssrLooseContain(selected.value, d.code) : ssrLooseEqual(selected.value, d.code)) ? " selected" : ""}>${ssrInterpolate(d.nom)} (${ssrInterpolate(d.an)} député${ssrInterpolate(d.an > 1 ? "s" : "")} · ${ssrInterpolate(d.senat)} sénateur${ssrInterpolate(d.senat > 1 ? "s" : "")}) </option>`);
      });
      _push(`<!--]--></select>`);
      if (loadingDep.value) {
        _push(`<div class="mt-4 text-sm text-brand-400">Chargement…</div>`);
      } else if (depElus.value.length) {
        _push(`<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(depElus.value, (e) => {
          _push(ssrRenderComponent(_component_EluCard, {
            key: e.id,
            elu: e
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/mes-elus.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=mes-elus-fReKXXmj.mjs.map
