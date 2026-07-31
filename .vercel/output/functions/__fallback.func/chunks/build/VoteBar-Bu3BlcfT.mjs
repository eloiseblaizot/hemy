import { defineComponent, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
import { a as totalDecompte, P as POSITION_META } from '../_/types.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SortBadge",
  __ssrInlineRender: true,
  props: {
    sort: {}
  },
  setup(__props) {
    const props = __props;
    const adopte = computed(() => props.sort?.toLowerCase().includes("adopt"));
    const label = computed(() => adopte.value ? "Adopté" : "Rejeté");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<span${ssrRenderAttrs(mergeProps({
        class: ["inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", adopte.value ? "bg-pour-soft text-pour" : "bg-contre-soft text-contre"]
      }, _attrs))}><span class="${ssrRenderClass([adopte.value ? "bg-pour" : "bg-contre", "inline-block h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(label.value)}</span>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SortBadge.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "SortBadge" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "VoteBar",
  __ssrInlineRender: true,
  props: {
    decompte: {},
    showLabels: { type: Boolean, default: false }
  },
  setup(__props) {
    const props = __props;
    const total = computed(() => totalDecompte(props.decompte));
    const segments = computed(() => {
      const t = total.value || 1;
      return [
        { key: "POUR", v: props.decompte.pour },
        { key: "CONTRE", v: props.decompte.contre },
        { key: "ABSTENTION", v: props.decompte.abstentions },
        { key: "NON_VOTANT", v: props.decompte.nonVotants }
      ].map((s) => ({ ...s, meta: POSITION_META[s.key], pct: s.v / t * 100 }));
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="flex h-2.5 w-full overflow-hidden rounded-full bg-brand-100" role="img"${ssrRenderAttr("aria-label", `Pour ${__props.decompte.pour}, contre ${__props.decompte.contre}, abstentions ${__props.decompte.abstentions}, non-votants ${__props.decompte.nonVotants}`)}><!--[-->`);
      ssrRenderList(segments.value, (s) => {
        _push(`<div class="h-full first:rounded-l-full last:rounded-r-full" style="${ssrRenderStyle({ width: s.pct + "%", backgroundColor: s.meta.couleur })}"${ssrRenderAttr("title", `${s.meta.label} : ${s.v}`)}></div>`);
      });
      _push(`<!--]--></div>`);
      if (__props.showLabels) {
        _push(`<div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-500"><!--[-->`);
        ssrRenderList(segments.value, (s) => {
          _push(`<span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full" style="${ssrRenderStyle({ backgroundColor: s.meta.couleur })}"></span> ${ssrInterpolate(s.meta.label)} <b class="tabular-nums text-brand-700">${ssrInterpolate(s.v)}</b></span>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/VoteBar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main, { __name: "VoteBar" });

export { __nuxt_component_2 as _, __nuxt_component_3 as a };
//# sourceMappingURL=VoteBar-Bu3BlcfT.mjs.map
