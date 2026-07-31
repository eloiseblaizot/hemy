import { p as prisma } from './db.mjs';

const groupeSelect = { id: true, code: true, libelle: true, libelleAbrege: true, couleur: true, ordre: true, chambre: true };
async function latestScrutins(opts = {}) {
  var _a, _b;
  return prisma.scrutin.findMany({
    where: opts.chambre ? { chambre: opts.chambre } : {},
    orderBy: [{ date: "desc" }, { numero: "desc" }],
    take: (_a = opts.limit) != null ? _a : 20,
    skip: (_b = opts.offset) != null ? _b : 0
  });
}
async function countScrutins(chambre) {
  return prisma.scrutin.count({ where: chambre ? { chambre } : {} });
}
async function scrutinDetail(id) {
  const scrutin = await prisma.scrutin.findUnique({ where: { id } });
  if (!scrutin) return null;
  const [analyses, votes] = await Promise.all([
    prisma.scrutinGroupe.findMany({
      where: { scrutinId: id },
      include: { groupe: { select: groupeSelect } },
      orderBy: { groupe: { ordre: "asc" } }
    }),
    prisma.voteNominatif.findMany({
      where: { scrutinId: id },
      select: {
        position: true,
        cause: true,
        parDelegation: true,
        elu: { select: { nom: true, prenom: true, slug: true, actif: true } },
        groupe: { select: { id: true, code: true, couleur: true, ordre: true, libelle: true } }
      }
    })
  ]);
  const groupes = analyses.map((a) => ({
    ...a.groupe,
    pour: a.pour,
    contre: a.contre,
    abstentions: a.abstentions,
    nonVotants: a.nonVotants,
    positionMajoritaire: a.positionMajoritaire,
    total: a.pour + a.contre + a.abstentions + a.nonVotants
  }));
  const sieges = votes.map((v) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    return {
      position: v.position,
      cause: v.cause,
      parDelegation: v.parDelegation,
      nom: (_b = (_a = v.elu) == null ? void 0 : _a.nom) != null ? _b : "",
      prenom: (_d = (_c = v.elu) == null ? void 0 : _c.prenom) != null ? _d : "",
      slug: (_f = (_e = v.elu) == null ? void 0 : _e.slug) != null ? _f : null,
      groupeId: (_h = (_g = v.groupe) == null ? void 0 : _g.id) != null ? _h : null,
      groupeCode: (_j = (_i = v.groupe) == null ? void 0 : _i.code) != null ? _j : null,
      groupeLibelle: (_l = (_k = v.groupe) == null ? void 0 : _k.libelle) != null ? _l : null,
      couleur: (_n = (_m = v.groupe) == null ? void 0 : _m.couleur) != null ? _n : "#9AA5B1",
      ordre: (_p = (_o = v.groupe) == null ? void 0 : _o.ordre) != null ? _p : 99
    };
  });
  return { scrutin, groupes, sieges };
}
async function eluBySlug(slug) {
  const elu = await prisma.elu.findUnique({ where: { slug }, include: { groupe: { select: groupeSelect } } });
  if (!elu) return null;
  const [grouped, presence, distributions] = await Promise.all([
    prisma.voteNominatif.groupBy({
      by: ["position"],
      where: { eluId: elu.id },
      _count: { _all: true }
    }),
    prisma.statPresence.findMany({ where: { eluId: elu.id } }),
    prisma.statDistribution.findMany({ where: { chambre: elu.chambre } })
  ]);
  const stats = { POUR: 0, CONTRE: 0, ABSTENTION: 0, NON_VOTANT: 0 };
  for (const g of grouped) stats[g.position] = g._count._all;
  return {
    elu,
    stats,
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    presence: presence.sort((a) => a.perimetre === "SOLENNEL" ? -1 : 1),
    distributions
  };
}
async function fraicheur() {
  const runs = await prisma.$queryRaw`
    SELECT DISTINCT ON (source) source, "finishedAt"
    FROM "IngestRun"
    WHERE ok = true AND "finishedAt" IS NOT NULL
    ORDER BY source, "finishedAt" DESC
  `;
  const derniereMaj = runs.reduce(
    (acc, r) => !acc || r.finishedAt > acc ? r.finishedAt : acc,
    null
  );
  return { runs, derniereMaj };
}
async function eluVotes(eluId, opts = {}) {
  var _a, _b;
  const where = { eluId };
  if (opts.position) where.position = opts.position;
  const [rows, total] = await Promise.all([
    prisma.voteNominatif.findMany({
      where,
      take: (_a = opts.limit) != null ? _a : 20,
      skip: (_b = opts.offset) != null ? _b : 0,
      orderBy: { scrutin: { date: "desc" } },
      select: {
        position: true,
        cause: true,
        parDelegation: true,
        scrutin: {
          select: { id: true, chambre: true, numero: true, date: true, titre: true, sortCode: true }
        }
      }
    }),
    prisma.voteNominatif.count({ where })
  ]);
  return { votes: rows, total };
}
async function groupeDetail(id) {
  const groupe = await prisma.groupe.findUnique({ where: { id } });
  if (!groupe) return null;
  const membres = await prisma.elu.findMany({
    where: { groupeId: id, actif: true },
    select: { id: true, slug: true, prenom: true, nom: true, departement: true, numDepartement: true, roleGroupe: true, photoUrl: true },
    orderBy: [{ nom: "asc" }]
  });
  return { groupe, membres, nbMembres: membres.length };
}
async function chambreOverview(chambre) {
  const [groupes, scrutins, total] = await Promise.all([
    prisma.groupe.findMany({
      where: { chambre, elus: { some: { actif: true } } },
      select: { ...groupeSelect, _count: { select: { elus: { where: { actif: true } } } } },
      orderBy: { ordre: "asc" }
    }),
    latestScrutins({ chambre, limit: 15 }),
    countScrutins(chambre)
  ]);
  return {
    groupes: groupes.map((g) => ({ ...g, nbMembres: g._count.elus })),
    scrutins,
    totalScrutins: total
  };
}
async function searchAll(q, limit = 20) {
  const term = q.normalize("NFC").trim();
  if (term.length < 2) return [];
  try {
    return await prisma.$queryRaw`
      WITH tq AS (
        SELECT websearch_to_tsquery('public.fr_unaccent', ${term}) AS q,
               lower(public.immutable_unaccent(${term}))           AS n
      )
      SELECT s.type, s.ref, s.chambre, s.label, s.sub, s.actif
      FROM public.search_index s, tq
      WHERE s.document @@ tq.q OR s.label_norm %> tq.n
      ORDER BY (
                 ts_rank_cd(s.document, tq.q) * 4
                 + similarity(s.label_norm, tq.n)
                 -- les élus en exercice passent devant les anciens
                 + CASE WHEN s.actif THEN 0.5 ELSE 0 END
               ) DESC,
               s.type, s.label
      LIMIT ${limit}
    `;
  } catch (err) {
    console.error("[search]", err.message);
    return [];
  }
}
async function departements() {
  var _a, _b;
  const rows = await prisma.elu.groupBy({
    by: ["numDepartement", "departement", "chambre"],
    where: { actif: true, numDepartement: { not: null } },
    _count: { _all: true }
  });
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const code = r.numDepartement;
    const e = (_b = map.get(code)) != null ? _b : { code, nom: (_a = r.departement) != null ? _a : code, an: 0, senat: 0 };
    if (r.chambre === "AN") e.an += r._count._all;
    else e.senat += r._count._all;
    if (r.departement) e.nom = r.departement;
    map.set(code, e);
  }
  return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
async function elusByDepartement(code) {
  return prisma.elu.findMany({
    where: { numDepartement: code, actif: true },
    include: { groupe: { select: groupeSelect } },
    orderBy: [{ chambre: "asc" }, { numCirco: "asc" }, { nom: "asc" }]
  });
}
async function elusByIds(ids) {
  if (!ids.length) return [];
  return prisma.elu.findMany({
    where: { id: { in: ids } },
    include: { groupe: { select: groupeSelect } },
    orderBy: [{ chambre: "asc" }, { nom: "asc" }]
  });
}

export { eluBySlug as a, eluVotes as b, chambreOverview as c, departements as d, elusByDepartement as e, elusByIds as f, fraicheur as g, groupeDetail as h, countScrutins as i, searchAll as j, latestScrutins as l, scrutinDetail as s };
//# sourceMappingURL=queries.mjs.map
