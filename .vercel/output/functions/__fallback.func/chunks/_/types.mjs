const POSITION_META = {
  POUR: { label: "Pour", labelCourt: "Pour", couleur: "var(--color-pour)", couleurDouce: "var(--color-pour-soft)", ordre: 0 },
  CONTRE: { label: "Contre", labelCourt: "Contre", couleur: "var(--color-contre)", couleurDouce: "var(--color-contre-soft)", ordre: 1 },
  ABSTENTION: { label: "Abstention", labelCourt: "Abst.", couleur: "var(--color-abstention)", couleurDouce: "var(--color-abstention-soft)", ordre: 2 },
  NON_VOTANT: { label: "N'a pas pris part", labelCourt: "N.V.", couleur: "var(--color-nonvotant)", couleurDouce: "var(--color-nonvotant-soft)", ordre: 3 }
};
const CHAMBRE_META = {
  AN: { label: "Assembl\xE9e nationale", labelCourt: "Assembl\xE9e", total: 577, slug: "assemblee-nationale" },
  SENAT: { label: "S\xE9nat", labelCourt: "S\xE9nat", total: 348, slug: "senat" }
};
function termeElu(chambre, pluriel = false) {
  if (chambre === "AN") return pluriel ? "d\xE9put\xE9s" : "d\xE9put\xE9";
  return pluriel ? "s\xE9nateurs" : "s\xE9nateur";
}
function totalDecompte(d) {
  return d.pour + d.contre + d.abstentions + d.nonVotants;
}

export { CHAMBRE_META as C, POSITION_META as P, totalDecompte as a, termeElu as t };
//# sourceMappingURL=types.mjs.map
