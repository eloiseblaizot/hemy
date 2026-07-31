import { defineComponent, ref, watch, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { b as useRouter } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "SearchBar",
  __ssrInlineRender: true,
  props: {
    big: { type: Boolean, default: false },
    placeholder: { default: "Rechercher un scrutin, un député, un groupe…" }
  },
  setup(__props) {
    const query = ref("");
    const results = ref([]);
    const open = ref(false);
    const loading = ref(false);
    useRouter();
    let timer;
    const TYPE_LABEL = { scrutin: "Scrutin", elu: "Élu·e", groupe: "Groupe" };
    watch(query, (q) => {
      clearTimeout(timer);
      if (q.trim().length < 2) {
        results.value = [];
        open.value = false;
        return;
      }
      loading.value = true;
      timer = setTimeout(async () => {
        try {
          const r = await $fetch("/api/search", { params: { q } });
          results.value = r.results || [];
          open.value = true;
        } catch {
          results.value = [];
        } finally {
          loading.value = false;
        }
      }, 180);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full" }, _attrs))}><form role="search"><div class="relative"><svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg><input${ssrRenderAttr("value", query.value)} type="search"${ssrRenderAttr("placeholder", __props.placeholder)} aria-label="Recherche" autocomplete="off" class="${ssrRenderClass([__props.big ? "h-13 py-3.5 text-base shadow-sm" : "h-10 py-2 text-sm", "w-full rounded-full border border-brand-200 bg-white pl-10 pr-4 text-brand-900 placeholder:text-brand-400 focus:border-brand-400 focus:outline-none"])}"></div></form>`);
      if (open.value && (results.value.length || loading.value)) {
        _push(`<div class="absolute z-40 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-brand-200 bg-white py-1 shadow-lg">`);
        if (loading.value && !results.value.length) {
          _push(`<p class="px-4 py-3 text-sm text-brand-400">Recherche…</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(results.value, (r, i) => {
          _push(`<button type="button" class="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-brand-50"><span class="mt-0.5 shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-500">${ssrInterpolate(TYPE_LABEL[r.type] || r.type)}</span><span class="min-w-0"><span class="block truncate text-sm font-medium text-brand-900">${ssrInterpolate(r.label)}</span><span class="block truncate text-xs text-brand-400">${ssrInterpolate(r.sub)}</span></span></button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SearchBar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "SearchBar" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=SearchBar-CBcL1CVJ.mjs.map
