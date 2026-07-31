import { defineComponent, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';
import { P as POSITION_META } from '../_/types.mjs';

const PERIMETRES = {
  SOLENNEL: {
    cle: "SOLENNEL",
    titre: "Scrutins solennels",
    description: "Votes solennels et motions de censure : programm\xE9s \xE0 l\u2019avance, ce sont ceux que l\u2019Assembl\xE9e retient elle-m\xEAme (article 159 de son R\xE8glement)."
  },
  TOUS: {
    cle: "TOUS",
    titre: "Tous les scrutins publics",
    description: "L\u2019ensemble des scrutins publics, y compris les votes d\u2019amendements tr\xE8s nombreux, souvent tenus pendant les r\xE9unions de commission."
  }
};
const MOTIFS = {
  "trop-peu-de-scrutins": "Trop peu de scrutins pendant son mandat pour calculer un indicateur.",
  "fonction-institutionnelle": "Par sa fonction (pr\xE9sidence de l\u2019Assembl\xE9e ou de s\xE9ance, fonctions minist\xE9rielles), cet \xE9lu ne prend pas part aux votes. L\u2019indicateur n\u2019est pas applicable."
};
const TITRE_INDICATEUR = "Votes en personne";
const AVERTISSEMENTS = [
  "Ce chiffre n\u2019est pas un taux de pr\xE9sence, et ce n\u2019est pas une mesure du travail d\u2019un d\xE9put\xE9.",
  "L\u2019Assembl\xE9e nationale ne publie aucun relev\xE9 de pr\xE9sence dans l\u2019h\xE9micycle : il y a un va-et-vient permanent en s\xE9ance. La seule chose que l\u2019on puisse compter, ce sont les votes effectivement enregistr\xE9s au nom du d\xE9put\xE9 lors des scrutins publics.",
  "La plupart des votes en s\xE9ance se font \xE0 main lev\xE9e et ne laissent aucune trace nominative : ils ne sont pas compt\xE9s ici.",
  "Un chiffre bas est normal. Les scrutins ont souvent lieu pendant les r\xE9unions de commission, les auditions, les missions ou le travail en circonscription \u2014 et les groupes ne font fr\xE9quemment voter que les d\xE9put\xE9s sp\xE9cialistes du texte discut\xE9.",
  "Les votes \xE9mis par d\xE9l\xE9gation ne sont pas compt\xE9s comme des votes en personne : la loi ne les autorise qu\u2019en cas d\u2019emp\xEAchement (ordonnance du 7 novembre 1958), donc d\u2019absence. Ils sont affich\xE9s s\xE9par\xE9ment. L\u2019Assembl\xE9e, elle, les compte comme de la participation dans son propre calcul.",
  "Les scrutins o\xF9 le d\xE9put\xE9 ne pouvait pas voter sont retir\xE9s du calcul : pr\xE9sidence de s\xE9ance, pr\xE9sidence de l\u2019Assembl\xE9e, fonctions minist\xE9rielles.",
  "Les absences justifi\xE9es ne sont pas distinguables : un cong\xE9 maladie, un cong\xE9 maternit\xE9 ou une mission officielle font baisser ce chiffre comme une absence de convenance. Les motifs ne sont pas publi\xE9s.",
  "Ce chiffre ne dit rien de la pr\xE9sence en commission, des amendements d\xE9pos\xE9s, des rapports r\xE9dig\xE9s, des questions pos\xE9es ni du travail en circonscription."
];
const NOTE_SENAT = [
  "Au S\xE9nat, une position de vote est enregistr\xE9e pour l\u2019ensemble des 348 s\xE9nateurs \xE0 chaque scrutin public, qu\u2019ils soient pr\xE9sents ou non : lors d\u2019un scrutin ordinaire, un seul membre d\u2019un groupe peut d\xE9poser les bulletins de tous ses coll\xE8gues. Aucun s\xE9nateur n\u2019est jamais \xAB manquant \xBB dans les donn\xE9es publi\xE9es.",
  "Les donn\xE9es ouvertes du S\xE9nat ne permettent donc pas de calculer un taux de pr\xE9sence ou d\u2019absence, et nous n\u2019en publions pas. Les positions affich\xE9es sont celles enregistr\xE9es au nom du s\xE9nateur, qui refl\xE8tent le plus souvent la consigne de son groupe."
];
const MENTION_SANS_CLASSEMENT = "Nous ne publions volontairement aucun classement des \xE9lus : aucune pond\xE9ration ne permettrait d\u2019\xE9tablir un palmar\xE8s juste.";
function libellePosition(position, cause, parDelegation) {
  var _a;
  if (position === "NON_VOTANT") {
    const precision = {
      PAN: " (pr\xE9sidait l\u2019Assembl\xE9e)",
      PSE: " (pr\xE9sidait la s\xE9ance)",
      MG: " (membre du Gouvernement)",
      DEPORT: " (d\xE9port)"
    };
    return `N\u2019a pas pris part au vote${cause ? (_a = precision[cause]) != null ? _a : "" : ""}`;
  }
  if (parDelegation) return "Vote \xE9mis par d\xE9l\xE9gation";
  if (position === "POUR") return "A vot\xE9 pour";
  if (position === "CONTRE") return "A vot\xE9 contre";
  return "S\u2019est abstenu";
}
function situer(taux, mediane, p10, p90) {
  if (taux >= p90) return "parmi les plus \xE9lev\xE9s des d\xE9put\xE9s";
  if (taux <= p10) return "parmi les plus bas des d\xE9put\xE9s";
  if (taux >= mediane) return "dans la moiti\xE9 haute des d\xE9put\xE9s";
  return "dans la moiti\xE9 basse des d\xE9put\xE9s";
}

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PositionBadge",
  __ssrInlineRender: true,
  props: {
    position: {},
    cause: {},
    parDelegation: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const meta = computed(() => POSITION_META[props.position]);
    const cls = computed(
      () => ({
        POUR: "bg-pour-soft text-pour",
        CONTRE: "bg-contre-soft text-contre",
        ABSTENTION: "bg-abstention-soft text-abstention",
        NON_VOTANT: "bg-nonvotant-soft text-brand-600"
      })[props.position]
    );
    const detail = computed(() => libellePosition(props.position, props.cause, props.parDelegation));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<span${ssrRenderAttrs(mergeProps({
        class: ["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", cls.value],
        title: detail.value
      }, _attrs))}><span class="inline-block h-1.5 w-1.5 rounded-full" style="${ssrRenderStyle({ backgroundColor: meta.value.couleur })}"></span> ${ssrInterpolate(meta.value.label)} `);
      if (__props.parDelegation) {
        _push(`<span class="font-normal opacity-75" aria-hidden="true">(délég.)</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="sr-only">${ssrInterpolate(detail.value)}</span></span>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PositionBadge.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_6 = Object.assign(_sfc_main, { __name: "PositionBadge" });

export { AVERTISSEMENTS as A, MOTIFS as M, NOTE_SENAT as N, PERIMETRES as P, TITRE_INDICATEUR as T, __nuxt_component_6 as _, MENTION_SANS_CLASSEMENT as a, situer as s };
//# sourceMappingURL=PositionBadge-BnsNiJ52.mjs.map
