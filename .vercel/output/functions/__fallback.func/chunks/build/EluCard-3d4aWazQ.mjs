import { _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1$1 } from './EluAvatar-BUYpBatK.mjs';
import { _ as __nuxt_component_5 } from './GroupePill-B8YRnj0I.mjs';
import { defineComponent, computed, mergeProps, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, createTextVNode, Fragment, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderAttr } from 'vue/server-renderer';
import { u as useMesElus } from './useMesElus-DfnSS5if.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "EluCard",
  __ssrInlineRender: true,
  props: {
    elu: {},
    showStar: { type: Boolean, default: true }
  },
  setup(__props) {
    const props = __props;
    const { has } = useMesElus();
    const to = computed(
      () => `${props.elu.chambre === "SENAT" ? "/senateurs" : "/deputes"}/${encodeURIComponent(props.elu.slug)}`
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_EluAvatar = __nuxt_component_1$1;
      const _component_GroupePill = __nuxt_component_5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative flex items-center gap-3 rounded-xl border border-brand-200/70 bg-white p-3 transition-colors hover:border-brand-300" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: to.value,
        class: "flex min-w-0 flex-1 items-center gap-3"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_EluAvatar, {
              "photo-url": __props.elu.photoUrl,
              prenom: __props.elu.prenom,
              nom: __props.elu.nom,
              couleur: __props.elu.groupe?.couleur,
              size: 46
            }, null, _parent2, _scopeId));
            _push2(`<span class="min-w-0"${_scopeId}><span class="block truncate font-medium text-brand-900"${_scopeId}>${ssrInterpolate(__props.elu.prenom)} ${ssrInterpolate(__props.elu.nom)}</span><span class="mt-1 flex items-center gap-2 text-xs text-brand-400"${_scopeId}>`);
            if (__props.elu.groupe) {
              _push2(ssrRenderComponent(_component_GroupePill, {
                groupe: __props.elu.groupe,
                link: false
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`<span class="truncate"${_scopeId}>${ssrInterpolate(__props.elu.departement)}`);
            if (__props.elu.numCirco) {
              _push2(`<!--[--> · ${ssrInterpolate(__props.elu.numCirco)}<sup${_scopeId}>e</sup> circ.<!--]-->`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</span></span></span>`);
          } else {
            return [
              createVNode(_component_EluAvatar, {
                "photo-url": __props.elu.photoUrl,
                prenom: __props.elu.prenom,
                nom: __props.elu.nom,
                couleur: __props.elu.groupe?.couleur,
                size: 46
              }, null, 8, ["photo-url", "prenom", "nom", "couleur"]),
              createVNode("span", { class: "min-w-0" }, [
                createVNode("span", { class: "block truncate font-medium text-brand-900" }, toDisplayString(__props.elu.prenom) + " " + toDisplayString(__props.elu.nom), 1),
                createVNode("span", { class: "mt-1 flex items-center gap-2 text-xs text-brand-400" }, [
                  __props.elu.groupe ? (openBlock(), createBlock(_component_GroupePill, {
                    key: 0,
                    groupe: __props.elu.groupe,
                    link: false
                  }, null, 8, ["groupe"])) : createCommentVNode("", true),
                  createVNode("span", { class: "truncate" }, [
                    createTextVNode(toDisplayString(__props.elu.departement), 1),
                    __props.elu.numCirco ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createTextVNode(" · " + toDisplayString(__props.elu.numCirco), 1),
                      createVNode("sup", null, "e"),
                      createTextVNode(" circ.")
                    ], 64)) : createCommentVNode("", true)
                  ])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      if (__props.showStar) {
        _push(`<button type="button" class="${ssrRenderClass([unref(has)(__props.elu.id) ? "text-amber-500" : "text-brand-300 hover:text-brand-500", "shrink-0 rounded-full p-1.5 text-lg leading-none transition-colors"])}"${ssrRenderAttr("aria-pressed", unref(has)(__props.elu.id))}${ssrRenderAttr("title", unref(has)(__props.elu.id) ? "Retirer de mes élus" : "Ajouter à mes élus")}>${ssrInterpolate(unref(has)(__props.elu.id) ? "★" : "☆")}</button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/EluCard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "EluCard" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=EluCard-3d4aWazQ.mjs.map
