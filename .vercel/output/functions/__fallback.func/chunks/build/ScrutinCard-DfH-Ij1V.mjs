import { _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1 } from './ChambreTag-DX-vVgF7.mjs';
import { _ as __nuxt_component_2, a as __nuxt_component_3$1 } from './VoteBar-Bu3BlcfT.mjs';
import { defineComponent, mergeProps, withCtx, unref, createVNode, toDisplayString, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { f as formatDate } from '../_/format.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ScrutinCard",
  __ssrInlineRender: true,
  props: {
    scrutin: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ChambreTag = __nuxt_component_1;
      const _component_SortBadge = __nuxt_component_2;
      const _component_VoteBar = __nuxt_component_3$1;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        to: `/scrutins/${encodeURIComponent(__props.scrutin.id)}`,
        class: "block rounded-xl border border-brand-200/70 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-start justify-between gap-2"${_scopeId}><div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-400"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_ChambreTag, {
              chambre: __props.scrutin.chambre,
              short: ""
            }, null, _parent2, _scopeId));
            _push2(`<span${_scopeId}>n°${ssrInterpolate(__props.scrutin.numero)}</span><span aria-hidden="true"${_scopeId}>·</span><span${_scopeId}>${ssrInterpolate(unref(formatDate)(__props.scrutin.date, { day: "numeric", month: "short", year: "numeric" }))}</span></div>`);
            _push2(ssrRenderComponent(_component_SortBadge, {
              sort: __props.scrutin.sortCode
            }, null, _parent2, _scopeId));
            _push2(`</div><p class="mt-2 line-clamp-2 text-sm font-medium leading-snug text-brand-900"${_scopeId}>${ssrInterpolate(__props.scrutin.titre)}</p><div class="mt-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_VoteBar, {
              decompte: {
                pour: __props.scrutin.pour,
                contre: __props.scrutin.contre,
                abstentions: __props.scrutin.abstentions,
                nonVotants: __props.scrutin.nonVotants
              }
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="mt-1.5 flex justify-between text-xs text-brand-400"${_scopeId}><span${_scopeId}><b class="text-pour"${_scopeId}>${ssrInterpolate(__props.scrutin.pour)}</b> pour · <b class="text-contre"${_scopeId}>${ssrInterpolate(__props.scrutin.contre)}</b> contre</span><span${_scopeId}>${ssrInterpolate(__props.scrutin.nombreVotants)} votants</span></div>`);
          } else {
            return [
              createVNode("div", { class: "flex items-start justify-between gap-2" }, [
                createVNode("div", { class: "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-400" }, [
                  createVNode(_component_ChambreTag, {
                    chambre: __props.scrutin.chambre,
                    short: ""
                  }, null, 8, ["chambre"]),
                  createVNode("span", null, "n°" + toDisplayString(__props.scrutin.numero), 1),
                  createVNode("span", { "aria-hidden": "true" }, "·"),
                  createVNode("span", null, toDisplayString(unref(formatDate)(__props.scrutin.date, { day: "numeric", month: "short", year: "numeric" })), 1)
                ]),
                createVNode(_component_SortBadge, {
                  sort: __props.scrutin.sortCode
                }, null, 8, ["sort"])
              ]),
              createVNode("p", { class: "mt-2 line-clamp-2 text-sm font-medium leading-snug text-brand-900" }, toDisplayString(__props.scrutin.titre), 1),
              createVNode("div", { class: "mt-3" }, [
                createVNode(_component_VoteBar, {
                  decompte: {
                    pour: __props.scrutin.pour,
                    contre: __props.scrutin.contre,
                    abstentions: __props.scrutin.abstentions,
                    nonVotants: __props.scrutin.nonVotants
                  }
                }, null, 8, ["decompte"])
              ]),
              createVNode("div", { class: "mt-1.5 flex justify-between text-xs text-brand-400" }, [
                createVNode("span", null, [
                  createVNode("b", { class: "text-pour" }, toDisplayString(__props.scrutin.pour), 1),
                  createTextVNode(" pour · "),
                  createVNode("b", { class: "text-contre" }, toDisplayString(__props.scrutin.contre), 1),
                  createTextVNode(" contre")
                ]),
                createVNode("span", null, toDisplayString(__props.scrutin.nombreVotants) + " votants", 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ScrutinCard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main, { __name: "ScrutinCard" });

export { __nuxt_component_3 as _ };
//# sourceMappingURL=ScrutinCard-DfH-Ij1V.mjs.map
