import { defineComponent, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';
import { C as CHAMBRE_META } from '../_/types.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ChambreTag",
  __ssrInlineRender: true,
  props: {
    chambre: {},
    short: { type: Boolean, default: false }
  },
  setup(__props) {
    const props = __props;
    const meta = computed(() => CHAMBRE_META[props.chambre]);
    const dot = computed(() => props.chambre === "AN" ? "#3a4f78" : "#8a6d3b");
    return (_ctx, _push, _parent, _attrs) => {
      if (meta.value) {
        _push(`<span${ssrRenderAttrs(mergeProps({ class: "inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700" }, _attrs))}><span class="inline-block h-1.5 w-1.5 rounded-full" style="${ssrRenderStyle({ backgroundColor: dot.value })}"></span> ${ssrInterpolate(__props.short ? meta.value.labelCourt : meta.value.label)}</span>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ChambreTag.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "ChambreTag" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=ChambreTag-DX-vVgF7.mjs.map
