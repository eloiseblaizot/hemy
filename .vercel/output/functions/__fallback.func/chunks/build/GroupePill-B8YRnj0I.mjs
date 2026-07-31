import { defineComponent, createVNode, resolveDynamicComponent, unref, resolveComponent, mergeProps, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderVNode, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "GroupePill",
  __ssrInlineRender: true,
  props: {
    groupe: {},
    link: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.groupe) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.link !== false && __props.groupe ? ("resolveComponent" in _ctx ? _ctx.resolveComponent : unref(resolveComponent))("NuxtLink") : "span"), mergeProps({
          to: __props.link !== false ? `/groupes/${encodeURIComponent(__props.groupe.id)}` : void 0,
          class: ["inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-white px-2 py-0.5 text-xs font-medium text-brand-700", __props.link !== false ? "transition-colors hover:bg-brand-50" : ""],
          title: __props.groupe.libelle
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style="${ssrRenderStyle({ backgroundColor: __props.groupe.couleur })}"${_scopeId}></span> ${ssrInterpolate(__props.groupe.code)}`);
            } else {
              return [
                createVNode("span", {
                  class: "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                  style: { backgroundColor: __props.groupe.couleur }
                }, null, 4),
                createTextVNode(" " + toDisplayString(__props.groupe.code), 1)
              ];
            }
          }),
          _: 1
        }), _parent);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/GroupePill.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_5 = Object.assign(_sfc_main, { __name: "GroupePill" });

export { __nuxt_component_5 as _ };
//# sourceMappingURL=GroupePill-B8YRnj0I.mjs.map
