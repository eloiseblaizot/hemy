import { u as useRoute, n as navigateTo, _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1 } from './EluProfile-Dzp7crC9.mjs';
import { defineComponent, computed, withAsyncContext, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
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
import './ChambreTag-DX-vVgF7.mjs';
import '../_/types.mjs';
import './GroupePill-B8YRnj0I.mjs';
import './PositionBadge-BnsNiJ52.mjs';
import '../_/format.mjs';
import './useMesElus-DfnSS5if.mjs';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = computed(() => String(route.params.slug));
    const { data } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/elus/${encodeURIComponent(slug.value)}`,
      { key: `elu-chk-${slug.value}` },
      "$lzx1_IzntP"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (data.value?.elu?.chambre === "SENAT") {
      [__temp, __restore] = withAsyncContext(() => navigateTo(`/senateurs/${encodeURIComponent(slug.value)}`, { redirectCode: 301 })), await __temp, __restore();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_EluProfile = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/chambre/assemblee-nationale",
        class: "text-sm text-brand-400 hover:text-brand-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`← Assemblée nationale`);
          } else {
            return [
              createTextVNode("← Assemblée nationale")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="mt-3">`);
      _push(ssrRenderComponent(_component_EluProfile, { slug: unref(slug) }, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/deputes/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-91U3HDGd.mjs.map
