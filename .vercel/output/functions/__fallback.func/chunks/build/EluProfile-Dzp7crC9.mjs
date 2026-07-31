import { _ as __nuxt_component_1$1 } from './EluAvatar-BUYpBatK.mjs';
import { _ as __nuxt_component_1$2 } from './ChambreTag-DX-vVgF7.mjs';
import { _ as __nuxt_component_5 } from './GroupePill-B8YRnj0I.mjs';
import { defineComponent, withAsyncContext, computed, ref, watch, unref, withCtx, createVNode, toDisplayString, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
import { _ as __nuxt_component_6, s as situer, N as NOTE_SENAT, T as TITRE_INDICATEUR, P as PERIMETRES, M as MOTIFS, A as AVERTISSEMENTS, a as MENTION_SANS_CLASSEMENT } from './PositionBadge-BnsNiJ52.mjs';
import { p as pct, f as formatDate, a as formatNumber } from '../_/format.mjs';
import { c as createError, a as useSeoMeta, _ as __nuxt_component_0 } from './server.mjs';
import { t as termeElu, P as POSITION_META } from '../_/types.mjs';
import { u as useFetch } from './fetch-oRboePVY.mjs';
import { u as useMesElus } from './useMesElus-DfnSS5if.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PresenceCard",
  __ssrInlineRender: true,
  props: {
    chambre: {},
    stats: {},
    distributions: {}
  },
  setup(__props) {
    const props = __props;
    const detailsOuverts = ref(false);
    const secondaireOuvert = ref(false);
    const principal = computed(() => props.stats.find((s) => s.perimetre === "SOLENNEL"));
    const secondaire = computed(() => props.stats.find((s) => s.perimetre === "TOUS"));
    const distri = (p) => props.distributions.find((d) => d.perimetre === p);
    const denominateur = (s) => s.eligibles - s.neutralises;
    const position = computed(() => {
      const s = principal.value;
      const d = distri("SOLENNEL");
      if (!s?.applicable || s.taux === null || !d) return null;
      return situer(s.taux, d.mediane, d.p10, d.p90);
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.chambre === "SENAT") {
        _push(`<section${ssrRenderAttrs(mergeProps({ class: "rounded-2xl border border-brand-200/70 bg-white p-5" }, _attrs))}><h2 class="font-bold text-brand-900">Pourquoi pas de taux de présence ?</h2><div class="mt-2 space-y-2 text-sm leading-relaxed text-brand-600"><!--[-->`);
        ssrRenderList(unref(NOTE_SENAT), (t, i) => {
          _push(`<p>${ssrInterpolate(t)}</p>`);
        });
        _push(`<!--]--></div></section>`);
      } else if (principal.value) {
        _push(`<section${ssrRenderAttrs(mergeProps({ class: "rounded-2xl border border-brand-200/70 bg-white p-5" }, _attrs))}><div class="flex flex-wrap items-baseline justify-between gap-2"><h2 class="font-bold text-brand-900">${ssrInterpolate(unref(TITRE_INDICATEUR))}</h2><span class="text-xs text-brand-400">${ssrInterpolate(unref(PERIMETRES).SOLENNEL.titre)}</span></div>`);
        if (!principal.value.applicable) {
          _push(`<p class="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-600">${ssrInterpolate(principal.value.motif ? unref(MOTIFS)[principal.value.motif] : "Indicateur non calculable.")}</p>`);
        } else {
          _push(`<!--[--><div class="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1"><span class="text-4xl font-bold tabular-nums text-brand-900">${ssrInterpolate(principal.value.taux.toFixed(0))} %</span><span class="text-sm text-brand-500">${ssrInterpolate(unref(formatNumber)(principal.value.personnels))} votes personnels sur ${ssrInterpolate(unref(formatNumber)(denominateur(principal.value)))} scrutins solennels tenus pendant son mandat </span></div><div class="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-100"><div class="h-full rounded-full bg-brand-500" style="${ssrRenderStyle({ width: Math.min(100, principal.value.taux) + "%" })}"></div></div>`);
          if (position.value && distri("SOLENNEL")) {
            _push(`<p class="mt-2 text-sm text-brand-500"> Situé <b class="font-medium text-brand-700">${ssrInterpolate(position.value)}</b> — la médiane est de ${ssrInterpolate(distri("SOLENNEL").mediane.toFixed(0))} %. </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        }
        if (principal.value.delegations > 0) {
          _push(`<p class="mt-3 border-t border-brand-100 pt-3 text-sm text-brand-600"><b class="font-medium">${ssrInterpolate(unref(formatNumber)(principal.value.delegations))}</b> vote${ssrInterpolate(principal.value.delegations > 1 ? "s" : "")} émis en son nom par un collègue (délégation), non compté${ssrInterpolate(principal.value.delegations > 1 ? "s" : "")} ci-dessus. </p>`);
        } else {
          _push(`<!---->`);
        }
        if (principal.value.neutralises > 0) {
          _push(`<p class="mt-1 text-sm text-brand-600"><b class="font-medium">${ssrInterpolate(unref(formatNumber)(principal.value.neutralises))}</b> scrutin${ssrInterpolate(principal.value.neutralises > 1 ? "s" : "")} retiré${ssrInterpolate(principal.value.neutralises > 1 ? "s" : "")} du calcul (fonction empêchant de voter). </p>`);
        } else {
          _push(`<!---->`);
        }
        if (secondaire.value) {
          _push(`<div class="mt-3 border-t border-brand-100 pt-3"><button type="button" class="flex w-full items-center justify-between text-left text-sm font-medium text-brand-600 hover:text-brand-900"><span>${ssrInterpolate(unref(PERIMETRES).TOUS.titre)}</span><span class="text-brand-400">${ssrInterpolate(secondaireOuvert.value ? "−" : "+")}</span></button>`);
          if (secondaireOuvert.value) {
            _push(`<div class="mt-2 text-sm text-brand-600">`);
            if (!secondaire.value.applicable) {
              _push(`<p>${ssrInterpolate(secondaire.value.motif ? unref(MOTIFS)[secondaire.value.motif] : "Non calculable.")}</p>`);
            } else {
              _push(`<p><b class="text-brand-900">${ssrInterpolate(secondaire.value.taux.toFixed(0))} %</b> — ${ssrInterpolate(unref(formatNumber)(secondaire.value.personnels))} votes personnels sur ${ssrInterpolate(unref(formatNumber)(denominateur(secondaire.value)))} scrutins. `);
              if (distri("TOUS")) {
                _push(`<span> La médiane des députés est de ${ssrInterpolate(distri("TOUS").mediane.toFixed(0))} %.</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</p>`);
            }
            _push(`<p class="mt-1 text-xs text-brand-400">${ssrInterpolate(unref(PERIMETRES).TOUS.description)}</p></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-4 rounded-xl bg-abstention-soft/60 p-3"><p class="text-sm font-medium text-brand-800">${ssrInterpolate(unref(AVERTISSEMENTS)[0])}</p><button type="button" class="mt-1 text-sm font-medium text-brand-600 underline hover:text-brand-900">${ssrInterpolate(detailsOuverts.value ? "Masquer les explications" : "Pourquoi ? Comment est-ce calculé ?")}</button>`);
        if (detailsOuverts.value) {
          _push(`<div class="mt-2 space-y-2 text-sm leading-relaxed text-brand-600"><!--[-->`);
          ssrRenderList(unref(AVERTISSEMENTS).slice(1), (t, i) => {
            _push(`<p>${ssrInterpolate(t)}</p>`);
          });
          _push(`<!--]--><p class="text-xs text-brand-500">${ssrInterpolate(unref(MENTION_SANS_CLASSEMENT))} Source : open data de l&#39;Assemblée nationale (scrutins publics et mandats). </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></section>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PresenceCard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "PresenceCard" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "EluProfile",
  __ssrInlineRender: true,
  props: {
    slug: {}
  },
  async setup(__props) {
    let __temp, __restore;
    const props = __props;
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/elus/${encodeURIComponent(props.slug)}`,
      { key: `elu-${props.slug}` },
      "$KFGOH_-xrJ"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: "Élu introuvable", fatal: true });
    const elu = computed(() => data.value.elu);
    const stats = computed(() => data.value.stats);
    const total = computed(() => data.value.total);
    const presence = computed(() => data.value.presence ?? []);
    const distributions = computed(() => data.value.distributions ?? []);
    const { has } = useMesElus();
    const votes = ref([...data.value.votes]);
    const votesTotal = ref(data.value.votesTotal);
    const position = ref("");
    async function reload() {
      const r = await $fetch(`/api/elus/${encodeURIComponent(props.slug)}/votes`, {
        params: { position: position.value || void 0, offset: 0, limit: 20 }
      });
      votes.value = r.votes;
      votesTotal.value = r.total;
    }
    watch(position, reload);
    const filters = [
      { key: "", label: "Tous" },
      { key: "POUR", label: "Pour" },
      { key: "CONTRE", label: "Contre" },
      { key: "ABSTENTION", label: "Abstention" },
      { key: "NON_VOTANT", label: "N’a pas pris part" }
    ];
    useSeoMeta({
      title: () => `${elu.value.prenom} ${elu.value.nom} — votes`,
      description: () => `Historique de votes de ${elu.value.prenom} ${elu.value.nom}.`
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_EluAvatar = __nuxt_component_1$1;
      const _component_ChambreTag = __nuxt_component_1$2;
      const _component_GroupePill = __nuxt_component_5;
      const _component_PresenceCard = __nuxt_component_3;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_PositionBadge = __nuxt_component_6;
      _push(`<div${ssrRenderAttrs(_attrs)}><header class="flex flex-col gap-4 rounded-2xl border border-brand-200/70 bg-white p-5 sm:flex-row sm:items-center">`);
      _push(ssrRenderComponent(_component_EluAvatar, {
        "photo-url": elu.value.photoUrl,
        prenom: elu.value.prenom,
        nom: elu.value.nom,
        couleur: elu.value.groupe?.couleur,
        size: 80
      }, null, _parent));
      _push(`<div class="min-w-0 flex-1"><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(_component_ChambreTag, {
        chambre: elu.value.chambre
      }, null, _parent));
      _push(`<span class="text-xs capitalize text-brand-400">${ssrInterpolate(unref(termeElu)(elu.value.chambre))}</span></div><h1 class="mt-1 text-2xl font-bold text-brand-900">${ssrInterpolate(elu.value.prenom)} ${ssrInterpolate(elu.value.nom)}</h1><div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-500">`);
      if (elu.value.groupe) {
        _push(ssrRenderComponent(_component_GroupePill, {
          groupe: elu.value.groupe
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (elu.value.roleGroupe && elu.value.roleGroupe !== "Membre du" && elu.value.roleGroupe !== "membre") {
        _push(`<span>· ${ssrInterpolate(elu.value.roleGroupe)}</span>`);
      } else {
        _push(`<!---->`);
      }
      if (elu.value.departement) {
        _push(`<span>· ${ssrInterpolate(elu.value.departement)}`);
        if (elu.value.numCirco) {
          _push(`<!--[--> (${ssrInterpolate(elu.value.numCirco)}<sup>e</sup> circ.)<!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</span>`);
      } else {
        _push(`<!---->`);
      }
      if (elu.value.profession) {
        _push(`<span class="text-brand-400">· ${ssrInterpolate(elu.value.profession)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><button type="button" class="${ssrRenderClass([unref(has)(elu.value.id) ? "border-amber-300 bg-amber-50 text-amber-700" : "border-brand-200 text-brand-600 hover:bg-brand-50", "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"])}">${ssrInterpolate(unref(has)(elu.value.id) ? "★ Suivi" : "☆ Suivre")}</button></header><div class="mt-5">`);
      _push(ssrRenderComponent(_component_PresenceCard, {
        chambre: elu.value.chambre,
        stats: presence.value,
        distributions: distributions.value
      }, null, _parent));
      _push(`</div><section class="mt-5"><h2 class="mb-2 font-bold text-brand-900">Positions enregistrées</h2><div class="grid grid-cols-2 gap-3 sm:grid-cols-4"><!--[-->`);
      ssrRenderList(["POUR", "CONTRE", "ABSTENTION", "NON_VOTANT"], (p) => {
        _push(`<div class="rounded-xl border border-brand-200/70 bg-white p-3"><div class="text-2xl font-bold tabular-nums" style="${ssrRenderStyle({ color: unref(POSITION_META)[p].couleur })}">${ssrInterpolate(stats.value[p])}</div><div class="text-xs text-brand-500">${ssrInterpolate(unref(POSITION_META)[p].label)} · ${ssrInterpolate(unref(pct)(stats.value[p], total.value))}%</div></div>`);
      });
      _push(`<!--]--></div></section><section class="mt-6"><div class="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 class="font-bold text-brand-900">Votes <span class="font-normal text-brand-400">(${ssrInterpolate(votesTotal.value)})</span></h2><div class="flex flex-wrap gap-1"><!--[-->`);
      ssrRenderList(filters, (f) => {
        _push(`<button class="${ssrRenderClass([position.value === f.key ? "bg-brand-900 text-white" : "bg-brand-100 text-brand-600 hover:bg-brand-200", "rounded-full px-3 py-1 text-xs font-medium transition"])}">${ssrInterpolate(f.label)}</button>`);
      });
      _push(`<!--]--></div></div><ul class="space-y-2"><!--[-->`);
      ssrRenderList(votes.value, (v, i) => {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/scrutins/${encodeURIComponent(v.scrutin.id)}`,
          class: "flex items-center gap-3 rounded-xl border border-brand-200/70 bg-white p-3 transition-colors hover:border-brand-300"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_PositionBadge, {
                position: v.position,
                cause: v.cause,
                "par-delegation": v.parDelegation
              }, null, _parent2, _scopeId));
              _push2(`<span class="min-w-0 flex-1"${_scopeId}><span class="line-clamp-2 text-sm text-brand-800"${_scopeId}>${ssrInterpolate(v.scrutin.titre)}</span><span class="mt-0.5 block text-xs text-brand-400"${_scopeId}>${ssrInterpolate(unref(formatDate)(v.scrutin.date, { day: "numeric", month: "short", year: "numeric" }))} · ${ssrInterpolate(v.scrutin.sortCode)}</span></span>`);
            } else {
              return [
                createVNode(_component_PositionBadge, {
                  position: v.position,
                  cause: v.cause,
                  "par-delegation": v.parDelegation
                }, null, 8, ["position", "cause", "par-delegation"]),
                createVNode("span", { class: "min-w-0 flex-1" }, [
                  createVNode("span", { class: "line-clamp-2 text-sm text-brand-800" }, toDisplayString(v.scrutin.titre), 1),
                  createVNode("span", { class: "mt-0.5 block text-xs text-brand-400" }, toDisplayString(unref(formatDate)(v.scrutin.date, { day: "numeric", month: "short", year: "numeric" })) + " · " + toDisplayString(v.scrutin.sortCode), 1)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul>`);
      if (votes.value.length < votesTotal.value) {
        _push(`<button class="mx-auto mt-4 block rounded-full border border-brand-200 px-5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"> Voir plus </button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/EluProfile.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "EluProfile" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=EluProfile-Dzp7crC9.mjs.map
