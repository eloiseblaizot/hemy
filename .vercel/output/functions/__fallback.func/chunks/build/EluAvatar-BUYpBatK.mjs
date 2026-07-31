import { defineComponent, ref, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "EluAvatar",
  __ssrInlineRender: true,
  props: {
    photoUrl: {},
    prenom: {},
    nom: {},
    size: { default: 44 },
    couleur: {}
  },
  setup(__props) {
    const props = __props;
    const err = ref(false);
    const initials = computed(
      () => `${(props.prenom || "").charAt(0)}${(props.nom || "").charAt(0)}`.toUpperCase() || "·"
    );
    const px = computed(() => `${props.size}px`);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<span${ssrRenderAttrs(mergeProps({
        class: "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-500 ring-2",
        style: { width: px.value, height: px.value, ["--tw-ring-color"]: __props.couleur || "transparent" }
      }, _attrs))}>`);
      if (__props.photoUrl && !err.value) {
        _push(`<img${ssrRenderAttr("src", __props.photoUrl)}${ssrRenderAttr("alt", `${__props.prenom} ${__props.nom}`)} class="h-full w-full object-cover" loading="lazy">`);
      } else {
        _push(`<span class="text-xs font-semibold">${ssrInterpolate(initials.value)}</span>`);
      }
      _push(`</span>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/EluAvatar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "EluAvatar" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=EluAvatar-BUYpBatK.mjs.map
