import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';
import { P as POSITION_META } from '../_/types.mjs';

function computeSeatPositions(totalSeats, options = {}) {
  var _a, _b, _c;
  const width = (_a = options.width) != null ? _a : 1e3;
  const seatRadius = (_b = options.seatRadius) != null ? _b : 8;
  const rowHeight = (_c = options.rowHeight) != null ? _c : 22;
  const height = width / 2;
  const cx = width / 2;
  const cy = height;
  const graphRadius = height - seatRadius;
  if (totalSeats <= 0) return [];
  const rows = [];
  let capacity = 0;
  let row = 0;
  while (capacity < totalSeats && row < 200) {
    const r = graphRadius - rowHeight * row;
    if (r < rowHeight) break;
    const minStep = Math.atan(2.5 * seatRadius / r);
    const seatsThisRow = Math.max(1, Math.floor(Math.PI / minStep));
    rows.push({ r, cap: seatsThisRow });
    capacity += seatsThisRow;
    row++;
  }
  if (!rows.length) rows.push({ r: graphRadius, cap: totalSeats });
  const totalCap = rows.reduce((s, x) => s + x.cap, 0);
  const raw = rows.map((rw) => totalSeats * rw.cap / totalCap);
  const counts = raw.map((v) => Math.floor(v));
  let rem = totalSeats - counts.reduce((a, b) => a + b, 0);
  const byFrac = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; rem > 0 && byFrac.length; k++, rem--) counts[byFrac[k % byFrac.length].i]++;
  const points = [];
  rows.forEach((rw, ri) => {
    const n = counts[ri];
    for (let i = 0; i < n; i++) {
      const angle = n === 1 ? Math.PI / 2 : i / (n - 1) * Math.PI;
      points.push({
        x: cx - rw.r * Math.cos(angle),
        y: cy - rw.r * Math.sin(angle),
        row: ri,
        angle
      });
    }
  });
  return points.sort((a, b) => a.angle - b.angle);
}

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Hemicycle",
  __ssrInlineRender: true,
  props: {
    seats: {},
    mode: { default: "position" },
    seatRadius: { default: 8 },
    hideLegend: { type: Boolean, default: false }
  },
  emits: ["seatClick"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const ORD = { POUR: 0, CONTRE: 1, ABSTENTION: 2, NON_VOTANT: 3 };
    const sorted = computed(
      () => [...props.seats].sort(
        (a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || ORD[a.position] - ORD[b.position]
      )
    );
    const points = computed(() => computeSeatPositions(sorted.value.length, { seatRadius: props.seatRadius }));
    function fill(s) {
      return props.mode === "groupe" ? s.couleur || "#9AA5B1" : POSITION_META[s.position].couleur;
    }
    const counts = computed(() => {
      const c = { POUR: 0, CONTRE: 0, ABSTENTION: 0, NON_VOTANT: 0 };
      for (const s of props.seats) c[s.position]++;
      return c;
    });
    const ariaLabel = computed(
      () => `Hémicycle : ${counts.value.POUR} pour, ${counts.value.CONTRE} contre, ${counts.value.ABSTENTION} abstentions, ${counts.value.NON_VOTANT} n'ayant pas pris part, sur ${props.seats.length} présents.`
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))}><svg${ssrRenderAttr("viewBox", `0 0 1000 ${1e3 / 2 + 14}`)} class="h-auto w-full" role="img"${ssrRenderAttr("aria-label", ariaLabel.value)}><!--[-->`);
      ssrRenderList(sorted.value, (s, i) => {
        _push(`<circle${ssrRenderAttr("cx", points.value[i]?.x)}${ssrRenderAttr("cy", points.value[i]?.y)}${ssrRenderAttr("r", __props.seatRadius)}${ssrRenderAttr("fill", fill(s))}${ssrRenderAttr("stroke", __props.mode === "position" ? "rgba(255,255,255,.65)" : "rgba(15,23,42,.10)")} stroke-width="0.6" class="${ssrRenderClass(s.slug ? "cursor-pointer transition-opacity hover:opacity-70" : "")}" style="${ssrRenderStyle(points.value[i] ? null : { display: "none" })}"><title>${ssrInterpolate((s.prenom + " " + s.nom).trim() || "Élu")}${ssrInterpolate(s.groupeCode ? ` — ${s.groupeCode}` : "")} — ${ssrInterpolate(unref(POSITION_META)[s.position].label)}</title></circle>`);
      });
      _push(`<!--]--></svg>`);
      if (!__props.hideLegend) {
        _push(`<ul class="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm"><!--[-->`);
        ssrRenderList(["POUR", "CONTRE", "ABSTENTION", "NON_VOTANT"], (p) => {
          _push(`<li class="flex items-center gap-1.5"><span class="inline-block h-3 w-3 rounded-full" style="${ssrRenderStyle({ backgroundColor: unref(POSITION_META)[p].couleur })}"></span><span class="font-medium text-brand-700">${ssrInterpolate(unref(POSITION_META)[p].label)}</span><span class="tabular-nums text-brand-400">${ssrInterpolate(counts.value[p])}</span></li>`);
        });
        _push(`<!--]--></ul>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Hemicycle.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main, { __name: "Hemicycle" });

export { __nuxt_component_4 as _ };
//# sourceMappingURL=Hemicycle-RgooZaHz.mjs.map
