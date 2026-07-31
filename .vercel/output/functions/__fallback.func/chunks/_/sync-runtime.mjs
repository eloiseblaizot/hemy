import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { P as PrismaClient, a as urlDirecte } from './db-url.mjs';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { unzipSync } from 'fflate';
import iconv from 'iconv-lite';
import { parse } from 'csv-parse/sync';
import { t as termeElu, C as CHAMBRE_META } from './types.mjs';
import 'node:url';
import '@prisma/client-runtime-utils';
import 'node:async_hooks';
import 'node:events';
import 'node:os';

var _a$1;
const g = globalThis;
const connectionString = urlDirecte();
function creer() {
  if (!connectionString) {
    throw new Error(
      "DIRECT_URL (ou DATABASE_URL) est absent. Copiez .env.example vers .env, ou lancez `npm run db:dev`."
    );
  }
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 15e3 });
  g.__pool = pool;
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
const prisma = (_a$1 = g.__prisma) != null ? _a$1 : creer();
g.__prisma = prisma;

const CACHE_DIR = join(process.cwd(), ".ingest-cache");
function md5(buf) {
  return createHash("md5").update(buf).digest("hex");
}
async function download(url, opts = {}) {
  var _a;
  const filename = (_a = opts.filename) != null ? _a : decodeURIComponent(url.split("/").pop() || "download.bin");
  const cachePath = join(CACHE_DIR, filename);
  if (!opts.force && existsSync(cachePath)) {
    const cached = await readFile(cachePath);
    if (!opts.md5 || md5(cached) === opts.md5) {
      console.log(`  \u21BA cache : ${filename} (${fmt(cached.length)})`);
      return cached;
    }
  }
  console.log(`  \u2193 ${url}`);
  let buf = await fetchFull(url, opts.chunkSize);
  if (opts.md5 && md5(buf) !== opts.md5) {
    console.warn(`  \u26A0 MD5 inattendu pour ${filename}, tentative par plages\u2026`);
    buf = await fetchRanged(url, buf.length || 0, opts.chunkSize);
    if (opts.md5 && md5(buf) !== opts.md5) {
      throw new Error(`MD5 toujours incorrect pour ${filename} apr\xE8s reprise.`);
    }
  }
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, buf);
  console.log(`  \u2713 ${filename} (${fmt(buf.length)})`);
  return buf;
}
async function fetchFull(url, chunkSize) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  const total = Number(res.headers.get("content-length") || 0);
  const acceptRanges = (res.headers.get("accept-ranges") || "").includes("bytes");
  const buf = Buffer.from(await res.arrayBuffer());
  if (total && buf.length < total && acceptRanges) {
    console.warn(`  \u26A0 r\xE9ponse tronqu\xE9e (${fmt(buf.length)}/${fmt(total)}), passage en Range\u2026`);
    return fetchRanged(url, total, chunkSize);
  }
  return buf;
}
async function fetchRanged(url, total, chunkSize = 6e6) {
  if (!total) {
    const head = await fetch(url, { method: "HEAD" });
    total = Number(head.headers.get("content-length") || 0);
    if (!total) throw new Error(`Taille inconnue pour ${url}`);
  }
  const parts = [];
  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, total - 1);
    const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
    if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status} (Range) pour ${url}`);
    parts.push(Buffer.from(await res.arrayBuffer()));
    process.stdout.write(`\r    \u2026${fmt(Math.min(end + 1, total))}/${fmt(total)}`);
  }
  process.stdout.write("\n");
  return Buffer.concat(parts);
}
function unzip(buf, filter) {
  return unzipSync(new Uint8Array(buf), filter ? { filter: (f) => filter(f.name) } : void 0);
}
async function rangeGet(url, a, b, etag) {
  const headers = { Range: `bytes=${a}-${b}` };
  if (etag) headers["If-Match"] = etag;
  const r = await fetch(url, { headers });
  if (r.status === 412) throw new Error("ETAG_CHANGED");
  if (r.status !== 206) throw new Error(`Range non support\xE9 : HTTP ${r.status} pour ${url}`);
  return Buffer.from(await r.arrayBuffer());
}
function decodeLatin1(buf) {
  return iconv.decode(Buffer.from(buf), "win1252");
}
function fmt(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const AN_ORDRE_GROUPE = {
  "LFI-NFP": 1,
  GDR: 2,
  EcoS: 3,
  SOC: 4,
  LIOT: 5,
  Dem: 6,
  EPR: 7,
  HOR: 8,
  DR: 9,
  UDR: 10,
  RN: 11,
  NI: 12
};
function anOrdreGroupe(codeAbrege) {
  var _a;
  if (!codeAbrege) return 99;
  return (_a = AN_ORDRE_GROUPE[codeAbrege]) != null ? _a : 90;
}
function normCode(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
const SENAT_CANON = {
  CRCE: { code: "CRCE", libelle: "Communiste R\xE9publicain Citoyen et \xC9cologiste - Kanaky", couleur: "#B01313", ordre: 1 },
  GEST: { code: "GEST", libelle: "\xC9cologiste - Solidarit\xE9 et Territoires", couleur: "#4E9A51", ordre: 2 },
  SER: { code: "SER", libelle: "Socialiste, \xC9cologiste et R\xE9publicain", couleur: "#E4526A", ordre: 3 },
  RDSE: { code: "RDSE", libelle: "Rassemblement D\xE9mocratique et Social Europ\xE9en", couleur: "#C9A227", ordre: 4 },
  RDPI: { code: "RDPI", libelle: "Rassemblement des D\xE9mocrates, Progressistes et Ind\xE9pendants", couleur: "#F19E39", ordre: 5 },
  UC: { code: "UC", libelle: "Union Centriste", couleur: "#3B6FB0", ordre: 6 },
  LIRT: { code: "LIRT", libelle: "Les Ind\xE9pendants - R\xE9publique et Territoires", couleur: "#8AB0D9", ordre: 7 },
  LR: { code: "LR", libelle: "Les R\xE9publicains", couleur: "#12386E", ordre: 8 },
  NI: { code: "NI", libelle: "Non inscrits", couleur: "#9AA5B1", ordre: 12 },
  NR: { code: "NR", libelle: "Non rattach\xE9s", couleur: "#B8C1CC", ordre: 13 }
};
const SENAT_ALIAS = {
  // ODSEN_GENERAL (valeurs actuelles)
  lesrepublicains: "LR",
  ser: "SER",
  uc: "UC",
  lesindependants: "LIRT",
  rdpi: "RDPI",
  crcek: "CRCE",
  gest: "GEST",
  rdse: "RDSE",
  ni: "NI",
  // Dosleg / HISTOGROUPES (codes historiques)
  ump: "LR",
  soc: "SER",
  crc: "CRCE",
  crce: "CRCE",
  eco: "GEST",
  ri: "LIRT",
  ind: "LIRT",
  gd: "NI",
  aucun: "NR",
  // variantes plausibles
  unioncentriste: "UC",
  socialisteecologisteetrepublicain: "SER"
};
function senatGroupeMeta(code) {
  const raw = (code != null ? code : "").trim();
  const key = SENAT_ALIAS[normCode(raw)];
  if (key) return SENAT_CANON[key];
  return { code: raw || "NI", libelle: raw || "Non inscrits", couleur: "#9AA5B1", ordre: 11 };
}

function slugify(input) {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function makeUniqueSlug(base, used, fallback) {
  let slug = slugify(base) || slugify(fallback) || fallback.toLowerCase();
  if (used.has(slug)) {
    let i = 2;
    while (used.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }
  used.add(slug);
  return slug;
}
function xmlText(value) {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const o = value;
    if (typeof o["#text"] === "string") return o["#text"];
  }
  return null;
}
function isNil(value) {
  if (value == null) return true;
  if (typeof value === "object") {
    const o = value;
    if (o["@xsi:nil"] === "true" || o["@xsi:nil"] === true) return true;
  }
  return false;
}
function str(value) {
  if (isNil(value)) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  const t = xmlText(value);
  return t ? t.trim() || null : null;
}
function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
function toInt(value) {
  if (value == null) return 0;
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : 0;
}
function toDate(value) {
  var _a;
  if (isNil(value)) return null;
  const s = (_a = xmlText(value)) != null ? _a : typeof value === "string" ? value : null;
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const BASE = "https://data.assemblee-nationale.fr/static/openData/repository/17";
const AN_SCRUTINS_ZIP = `${BASE}/loi/scrutins/Scrutins.json.zip`;
const AMO30 = `${BASE}/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip`;
const AN_LEGISLATURE = "17";
const dec = new TextDecoder("utf-8");
async function anReferentiel(force = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const buf = await download(AMO30, { filename: "AMO30_17.json.zip", force });
  const files = unzip(buf);
  const groupes = [];
  const elus = [];
  const appartenances = [];
  for (const [path, bytes] of Object.entries(files)) {
    if (path.includes("/organe/")) {
      const o = JSON.parse(dec.decode(bytes)).organe;
      if ((o == null ? void 0 : o.codeType) === "GP" && String(o.legislature) === AN_LEGISLATURE) {
        const abrege = str(o.libelleAbrege);
        groupes.push({
          id: str(o.uid),
          code: abrege || str(o.libelleAbrev) || str(o.libelle) || "?",
          libelle: str(o.libelle) || abrege || "?",
          libelleAbrege: abrege,
          couleur: str(o.couleurAssociee) || "#9AA5B1",
          ordre: anOrdreGroupe(abrege)
        });
      }
      continue;
    }
    if (!path.includes("/acteur/")) continue;
    const a = JSON.parse(dec.decode(bytes)).acteur;
    const uid = xmlText(a == null ? void 0 : a.uid);
    if (!uid) continue;
    const mandats = toArray((_a = a.mandats) == null ? void 0 : _a.mandat).filter(
      (m) => String(m.legislature) === AN_LEGISLATURE
    );
    const gpMandats = mandats.filter((m) => m.typeOrgane === "GP");
    if (!gpMandats.length) continue;
    for (const m of gpMandats) {
      const gid = xmlText((_b = m.organes) == null ? void 0 : _b.organeRef);
      if (!gid) continue;
      appartenances.push({
        eluId: uid,
        groupeId: gid,
        dateDebut: toDate(m.dateDebut),
        dateFin: isNil(m.dateFin) ? null : toDate(m.dateFin),
        fonction: (_d = (_c = m.infosQualite) == null ? void 0 : _c.libQualite) != null ? _d : null
      });
    }
    const gpCourant = (_e = gpMandats.find((m) => isNil(m.dateFin))) != null ? _e : [...gpMandats].sort((x, y) => {
      var _a2, _b2;
      return String((_a2 = y.dateFin) != null ? _a2 : "").localeCompare(String((_b2 = x.dateFin) != null ? _b2 : ""));
    })[0];
    const actif = gpMandats.some((m) => isNil(m.dateFin));
    const asmOuvert = mandats.find((m) => m.typeOrgane === "ASSEMBLEE" && isNil(m.dateFin));
    const asmDernier = asmOuvert != null ? asmOuvert : mandats.filter((m) => m.typeOrgane === "ASSEMBLEE").sort((x, y) => {
      var _a2, _b2;
      return String((_a2 = y.dateFin) != null ? _a2 : "").localeCompare(String((_b2 = x.dateFin) != null ? _b2 : ""));
    })[0];
    const lieu = (_g = (_f = asmDernier == null ? void 0 : asmDernier.election) == null ? void 0 : _f.lieu) != null ? _g : {};
    const ident = (_i = (_h = a.etatCivil) == null ? void 0 : _h.ident) != null ? _i : {};
    elus.push({
      id: uid,
      civilite: str(ident.civ),
      prenom: (_j = str(ident.prenom)) != null ? _j : "",
      nom: (_k = str(ident.nom)) != null ? _k : "",
      dateNaissance: toDate((_m = (_l = a.etatCivil) == null ? void 0 : _l.infoNaissance) == null ? void 0 : _m.dateNais),
      profession: str((_n = a.profession) == null ? void 0 : _n.libelleCourant),
      region: str(lieu.region),
      departement: str(lieu.departement),
      numDepartement: str(lieu.numDepartement),
      numCirco: str(lieu.numCirco),
      photoUrl: `https://www2.assemblee-nationale.fr/static/tribun/17/photos/${uid.replace("PA", "")}.jpg`,
      actif,
      groupeId: gpCourant ? xmlText((_o = gpCourant.organes) == null ? void 0 : _o.organeRef) : null,
      roleGroupe: (_q = (_p = gpCourant == null ? void 0 : gpCourant.infosQualite) == null ? void 0 : _p.libQualite) != null ? _q : null
    });
  }
  return { groupes, elus, appartenances };
}
async function anZipHead() {
  const head = await fetch(AN_SCRUTINS_ZIP, { method: "HEAD" });
  if (!head.ok) throw new Error(`HEAD ${AN_SCRUTINS_ZIP} \u2192 HTTP ${head.status}`);
  const size = Number(head.headers.get("content-length"));
  const etag = head.headers.get("etag");
  const eocd = await rangeGet(AN_SCRUTINS_ZIP, size - 22, size - 1);
  if (eocd.readUInt32LE(0) !== 101010256) throw new Error("EOCD introuvable (commentaire zip ?)");
  const total = eocd.readUInt16LE(10);
  if (total === 65535) throw new Error("Zip64 : plus de 65535 entr\xE9es, parseur \xE0 \xE9tendre");
  return { size, total, cdSize: eocd.readUInt32LE(12), cdOff: eocd.readUInt32LE(16), etag };
}
async function anManifest(head) {
  const h = head != null ? head : await anZipHead();
  const cd = await rangeGet(AN_SCRUTINS_ZIP, h.cdOff, h.cdOff + h.cdSize - 1, h.etag);
  const entries = [];
  let p = 0;
  for (let i = 0; i < h.total; i++) {
    if (cd.readUInt32LE(p) !== 33639248) throw new Error(`signature central directory invalide \xE0 ${p}`);
    const crc = cd.readUInt32LE(p + 16);
    const csize = cd.readUInt32LE(p + 20);
    const nlen = cd.readUInt16LE(p + 28);
    const elen = cd.readUInt16LE(p + 30);
    const clen = cd.readUInt16LE(p + 32);
    const lho = cd.readUInt32LE(p + 42);
    const name = cd.toString("utf8", p + 46, p + 46 + nlen);
    const m = name.match(/V(\d+)\.json$/i);
    if (m) entries.push({ numero: Number(m[1]), name, crc: crc.toString(16).padStart(8, "0"), csize, lho });
    p += 46 + nlen + elen + clen;
  }
  return { head: h, entries };
}
async function anFetchScrutin(e, head) {
  const end = Math.min(e.lho + 30 + 256 + e.csize, head.cdOff - 1);
  const buf = await rangeGet(AN_SCRUTINS_ZIP, e.lho, end, head.etag);
  if (buf.readUInt32LE(0) !== 67324752) throw new Error("en-t\xEAte local de zip invalide");
  const nlen = buf.readUInt16LE(26);
  const elen = buf.readUInt16LE(28);
  const start = 30 + nlen + elen;
  const raw = buf.subarray(start, start + e.csize);
  const json = zlib.inflateRawSync(raw);
  return JSON.parse(json.toString("utf8")).scrutin;
}
async function anAllScrutins(force = false, filter, totalAttendu) {
  const lire = async (f) => {
    const buf = await download(AN_SCRUTINS_ZIP, { filename: "Scrutins.json.zip", force: f });
    return unzip(buf, (name) => name.endsWith(".json"));
  };
  let files = await lire(force);
  if (!force && totalAttendu && Object.keys(files).length < totalAttendu) {
    console.log(
      `  \u26A0 zip en cache incomplet (${Object.keys(files).length}/${totalAttendu} scrutins) \u2192 ret\xE9l\xE9chargement`
    );
    files = await lire(true);
  }
  const out = [];
  for (const [name, bytes] of Object.entries(files)) {
    if (filter) {
      const m = name.match(/V(\d+)\.json$/i);
      if (!m || !filter(Number(m[1]))) continue;
    }
    out.push(JSON.parse(dec.decode(bytes)).scrutin);
  }
  return out;
}

const ODSEN_GENERAL = "https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv";
const ODSEN_HISTO = "https://data.senat.fr/data/senateurs/ODSEN_HISTOGROUPES.csv";
function norm(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function parseCsv(buf) {
  return parse(decodeLatin1(buf), {
    columns: true,
    comment: "%",
    delimiter: ",",
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true
  });
}
function keyResolver(rows) {
  var _a;
  const keys = Object.keys((_a = rows[0]) != null ? _a : {});
  return (target) => {
    var _a2;
    return (_a2 = keys.find((k) => norm(k) === norm(target))) != null ? _a2 : keys.find((k) => norm(k).includes(norm(target)));
  };
}
function toDateCivile(s) {
  if (!s || !s.trim()) return null;
  const m = s.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!m) return null;
  return /* @__PURE__ */ new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
}
function cleDepartement(libelle) {
  return norm(libelle);
}
async function senatReferentiel(force = false, codesDepartement) {
  var _a;
  const general = parseCsv(await download(ODSEN_GENERAL, { force }));
  const g = keyResolver(general);
  const cMat = g("Matricule");
  const cQ = g("Qualit\xE9");
  const cNom = g("Nom usuel");
  const cPrenom = g("Pr\xE9nom usuel");
  const cEtat = g("\xC9tat");
  const cNaiss = g("Date naissance");
  const cGrp = g("Groupe politique");
  const cCirco = g("Circonscription");
  const cProf = g("Description de la profession");
  const cRole = g("Fonction au Bureau du S\xE9nat");
  const groupes = /* @__PURE__ */ new Map();
  const elus = [];
  for (const r of general) {
    const mat = (r[cMat] || "").trim().toUpperCase();
    if (!mat) continue;
    const circo = cCirco ? (r[cCirco] || "").trim() : "";
    const meta = senatGroupeMeta(r[cGrp]);
    const gid = `SEN-${meta.code}`;
    groupes.set(gid, { id: gid, code: meta.code, libelle: meta.libelle, couleur: meta.couleur, ordre: meta.ordre });
    elus.push({
      id: mat,
      civilite: cQ ? r[cQ] || null : null,
      prenom: (r[cPrenom] || "").trim(),
      nom: (r[cNom] || "").trim(),
      dateNaissance: cNaiss ? toDateCivile(r[cNaiss]) : null,
      profession: cProf ? r[cProf] || null : null,
      departement: circo || null,
      numDepartement: circo ? (_a = codesDepartement == null ? void 0 : codesDepartement.get(cleDepartement(circo))) != null ? _a : null : null,
      photoUrl: `https://www.senat.fr/senimg/${mat}.jpg`,
      actif: cEtat ? (r[cEtat] || "").trim().toUpperCase() === "ACTIF" : true,
      groupeId: gid,
      roleGroupe: cRole ? r[cRole] || null : null
    });
  }
  const histo = parseCsv(await download(ODSEN_HISTO, { force }));
  const h = keyResolver(histo);
  const hMat = h("Matricule");
  const hCode = h("Code du groupe politique");
  const hDeb = h("Date de d\xE9but d'appartenance");
  const hFin = h("Date de fin d'appartenance");
  const hFonc = h("Nom court fonction");
  const appartenances = [];
  for (const r of histo) {
    const mat = (r[hMat] || "").trim().toUpperCase();
    if (!mat) continue;
    const meta = senatGroupeMeta(r[hCode]);
    const gid = `SEN-${meta.code}`;
    if (!groupes.has(gid)) {
      groupes.set(gid, { id: gid, code: meta.code, libelle: meta.libelle, couleur: meta.couleur, ordre: meta.ordre });
    }
    appartenances.push({
      eluId: mat,
      groupeId: gid,
      dateDebut: hDeb ? toDateCivile(r[hDeb]) : null,
      dateFin: hFin ? toDateCivile(r[hFin]) : null,
      fonction: hFonc ? r[hFonc] || null : null
    });
  }
  return { groupes: [...groupes.values()], elus, appartenances };
}
const MOIS = {
  janvier: 1,
  f\u00E9vrier: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  ao\u00FBt: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  d\u00E9cembre: 12,
  decembre: 12
};
function txt(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
async function senatListeSession(session) {
  var _a, _b;
  const url = `https://www.senat.fr/scrutin-public/scr${session}.html`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} \u2192 HTTP ${r.status}`);
  const html = Buffer.from(await r.arrayBuffer()).toString("utf8");
  const anchor = html.indexOf('id="accordion-1"');
  const body = anchor >= 0 ? html.slice(anchor) : html;
  const items = [];
  let dateIso = "";
  const RE = /<div class="list-group-subtitle">([^<]+)<\/div>|<p class="my-2">([\s\S]*?)<\/p>/g;
  for (const m of body.matchAll(RE)) {
    if (m[1] !== void 0) {
      const d = txt(m[1]).match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
      if (d) {
        const mois = MOIS[d[2].toLowerCase()];
        if (mois) dateIso = `${d[3]}-${String(mois).padStart(2, "0")}-${String(+d[1]).padStart(2, "0")}`;
      }
      continue;
    }
    const p = m[2];
    const num = p.match(new RegExp(`scr${session}-(\\d+)\\.html`));
    if (!num || !dateIso) continue;
    const badge = p.match(/<span class="badge[^"]*">([^<]*)<\/span>/);
    const doss = p.match(/href="(\/dossier-legislatif\/[^"]+)"/);
    let objet = txt(p.replace(/<a href="\/dossier-legislatif[\s\S]*?<\/a>/g, "")).replace(
      /^Scrutin N°\d+\s*:\s*/i,
      ""
    );
    if (badge) objet = objet.replace(txt(badge[1]), "");
    objet = objet.replace(/\s*[-–]\s*\.?\s*$/, "").trim();
    items.push({
      numero: Number(num[1]),
      date: /* @__PURE__ */ new Date(`${dateIso}T00:00:00.000Z`),
      objet,
      sortCode: /adopt/i.test((_a = badge == null ? void 0 : badge[1]) != null ? _a : "") ? "adopt\xE9" : "rejet\xE9",
      dossier: (_b = doss == null ? void 0 : doss[1]) != null ? _b : null
    });
  }
  return items;
}
const SEN_POS = { p: "POUR", c: "CONTRE", a: "ABSTENTION", n: "NON_VOTANT" };
async function senatVotes(session, numero) {
  var _a;
  const jsonUrl = `https://www.senat.fr/scrutin-public/${session}/scr${session}-${numero}.json`;
  const r = await fetch(jsonUrl);
  if (r.status === 404) return null;
  if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
    const data = await r.json();
    const votes = ((_a = data.votes) != null ? _a : []).map((v) => ({
      eluId: (v.matricule || "").toUpperCase(),
      position: SEN_POS[v.vote],
      siege: typeof v.siege === "number" ? v.siege : null
    })).filter((v) => v.eluId && v.position);
    if (votes.length) return { votes, lastModified: r.headers.get("last-modified") };
  }
  return senatVotesHtml(session, numero);
}
async function senatVotesHtml(session, numero) {
  const url = `https://www.senat.fr/scrutin-public/${session}/scr${session}-${numero}.html`;
  const r = await fetch(url);
  if (r.status === 404 || !r.ok) return null;
  const html = Buffer.from(await r.arrayBuffer()).toString("utf8");
  const MAT = /href="\/senateur\/[^"]*?([0-9]{5}[a-z0-9])\.html"/g;
  const SECTIONS = {
    "1": "POUR",
    "2": "CONTRE",
    "3": "ABSTENTION",
    "4": "NON_VOTANT"
  };
  const votes = [];
  const seen = /* @__PURE__ */ new Set();
  for (const [sid, pos] of Object.entries(SECTIONS)) {
    const i = html.indexOf(`id="accordion-collapse-${sid}"`);
    if (i < 0) continue;
    const j = html.indexOf(`id="accordion-collapse-${Number(sid) + 1}"`);
    const seg = html.slice(i, j > i ? j : html.length);
    for (const m of seg.matchAll(MAT)) {
      const id = m[1].toUpperCase();
      if (seen.has(id)) continue;
      seen.add(id);
      votes.push({ eluId: id, position: pos, siege: null });
    }
  }
  return votes.length ? { votes, lastModified: r.headers.get("last-modified") } : null;
}
function senatSessionCourante(now = /* @__PURE__ */ new Date()) {
  return now.getUTCMonth() + 1 >= 10 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

const CHUNK = 4e3;
async function chunked(rows, fn) {
  for (let i = 0; i < rows.length; i += CHUNK) await fn(rows.slice(i, i + CHUNK));
}
let cacheGroupes = null;
let cacheElus = null;
async function groupesConnus() {
  if (!cacheGroupes) {
    cacheGroupes = new Set((await prisma.groupe.findMany({ select: { id: true } })).map((g) => g.id));
  }
  return cacheGroupes;
}
async function elusConnus() {
  if (!cacheElus) {
    cacheElus = new Set((await prisma.elu.findMany({ select: { id: true } })).map((e) => e.id));
  }
  return cacheElus;
}
function inviderCaches() {
  cacheGroupes = null;
  cacheElus = null;
}
async function upsertGroupes(groupes, chambre, legislature) {
  var _a;
  for (const g of groupes) {
    const data = {
      chambre,
      code: g.code,
      libelle: g.libelle,
      libelleAbrege: (_a = g.libelleAbrege) != null ? _a : null,
      couleur: g.couleur,
      ordre: g.ordre,
      legislature
    };
    await prisma.groupe.upsert({ where: { id: g.id }, create: { id: g.id, ...data }, update: data });
  }
  inviderCaches();
}
async function upsertElus(elus, chambre, legislature) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const existing = await prisma.elu.findMany({ select: { id: true, slug: true } });
  const used = new Set(existing.map((e) => e.slug));
  const slugById = new Map(existing.map((e) => [e.id, e.slug]));
  const groupeIds = new Set((await prisma.groupe.findMany({ select: { id: true } })).map((g) => g.id));
  for (const e of elus) {
    const slug = (_a = slugById.get(e.id)) != null ? _a : makeUniqueSlug(`${e.prenom} ${e.nom}`, used, e.id);
    const data = {
      chambre,
      civilite: (_b = e.civilite) != null ? _b : null,
      prenom: e.prenom,
      nom: e.nom,
      slug,
      dateNaissance: (_c = e.dateNaissance) != null ? _c : null,
      profession: (_d = e.profession) != null ? _d : null,
      region: (_e = e.region) != null ? _e : null,
      departement: (_f = e.departement) != null ? _f : null,
      numDepartement: (_g = e.numDepartement) != null ? _g : null,
      numCirco: (_h = e.numCirco) != null ? _h : null,
      photoUrl: (_i = e.photoUrl) != null ? _i : null,
      actif: e.actif,
      legislature,
      groupeId: e.groupeId && groupeIds.has(e.groupeId) ? e.groupeId : null,
      roleGroupe: (_j = e.roleGroupe) != null ? _j : null
    };
    await prisma.elu.upsert({ where: { id: e.id }, create: { id: e.id, ...data }, update: data });
  }
  inviderCaches();
}
async function replaceAppartenances(app, chambre) {
  const eluIds = (await prisma.elu.findMany({ where: { chambre }, select: { id: true } })).map((e) => e.id);
  const known = new Set(eluIds);
  const groupeIds = new Set(
    (await prisma.groupe.findMany({ where: { chambre }, select: { id: true } })).map((g) => g.id)
  );
  await prisma.appartenanceGroupe.deleteMany({ where: { eluId: { in: eluIds } } });
  const rows = app.filter((a) => known.has(a.eluId) && groupeIds.has(a.groupeId));
  await chunked(rows, (part) => prisma.appartenanceGroupe.createMany({ data: part }));
  return rows.length;
}
async function ensureElusFantomes(ids, chambre, groupeId) {
  if (!ids.length) return 0;
  const known = await elusConnus();
  const manquants = ids.filter((id) => !known.has(id));
  for (const id of manquants) {
    const label = chambre === "AN" ? "(Ancien d\xE9put\xE9)" : "(Ancien s\xE9nateur)";
    await prisma.elu.upsert({
      where: { id },
      create: {
        id,
        chambre,
        prenom: "",
        nom: label,
        slug: `${chambre.toLowerCase()}-${id.toLowerCase()}`,
        actif: false,
        groupeId
      },
      update: {}
    });
    known.add(id);
  }
  return manquants.length;
}
const AN_CATEGORIES = [
  ["pours", "POUR"],
  ["contres", "CONTRE"],
  ["abstentions", "ABSTENTION"],
  ["nonVotants", "NON_VOTANT"]
];
async function upsertScrutinAN(s, checksum) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
  const synth = (_a = s.syntheseVote) != null ? _a : {};
  const d = (_b = synth.decompte) != null ? _b : {};
  const numero = String((_c = s.numero) != null ? _c : "");
  const data = {
    chambre: "AN",
    numero,
    numeroInt: Number.parseInt(numero, 10) || 0,
    legislature: String((_d = s.legislature) != null ? _d : "17"),
    session: str(s.sessionRef),
    date: (_e = toDate(s.dateScrutin)) != null ? _e : /* @__PURE__ */ new Date(0),
    titre: (_h = (_g = str(s.titre)) != null ? _g : str((_f = s.objet) == null ? void 0 : _f.libelle)) != null ? _h : "Scrutin",
    objet: str((_i = s.objet) == null ? void 0 : _i.libelle),
    demandeur: str((_j = s.demandeur) == null ? void 0 : _j.texte),
    typeVoteCode: str((_k = s.typeVote) == null ? void 0 : _k.codeTypeVote),
    typeVoteLibelle: str((_l = s.typeVote) == null ? void 0 : _l.libelleTypeVote),
    sortCode: (_n = str((_m = s.sort) == null ? void 0 : _m.code)) != null ? _n : "",
    sortLibelle: str((_o = s.sort) == null ? void 0 : _o.libelle),
    nombreVotants: toInt(synth.nombreVotants),
    suffragesExprimes: toInt(synth.suffragesExprimes),
    nbrSuffragesRequis: toInt(synth.nbrSuffragesRequis),
    pour: toInt(d.pour),
    contre: toInt(d.contre),
    abstentions: toInt(d.abstentions),
    nonVotants: toInt(d.nonVotants) + toInt(d.nonVotantsVolontaires),
    sourceChecksum: checksum,
    majAt: /* @__PURE__ */ new Date()
  };
  const analyses = /* @__PURE__ */ new Map();
  const votes = /* @__PURE__ */ new Map();
  for (const g of toArray((_r = (_q = (_p = s.ventilationVotes) == null ? void 0 : _p.organe) == null ? void 0 : _q.groupes) == null ? void 0 : _r.groupe)) {
    const groupeId = xmlText(g.organeRef);
    if (!groupeId) continue;
    if (!analyses.has(groupeId)) {
      const dv = (_t = (_s = g.vote) == null ? void 0 : _s.decompteVoix) != null ? _t : {};
      analyses.set(groupeId, {
        scrutinId: s.uid,
        groupeId,
        nombreMembres: toInt(g.nombreMembresGroupe),
        positionMajoritaire: (_v = (_u = g.vote) == null ? void 0 : _u.positionMajoritaire) != null ? _v : null,
        pour: toInt(dv.pour),
        contre: toInt(dv.contre),
        abstentions: toInt(dv.abstentions),
        nonVotants: toInt(dv.nonVotants) + toInt(dv.nonVotantsVolontaires)
      });
    }
    const dn = (_x = (_w = g.vote) == null ? void 0 : _w.decompteNominatif) != null ? _x : {};
    for (const [key, position] of AN_CATEGORIES) {
      const cat = dn[key];
      if (!cat) continue;
      for (const v of toArray(cat.votant)) {
        const eluId = xmlText(v.acteurRef);
        if (!eluId || votes.has(eluId)) continue;
        votes.set(eluId, {
          scrutinId: s.uid,
          eluId,
          groupeId,
          position,
          parDelegation: v.parDelegation === "true",
          cause: (_y = v.causePositionVote) != null ? _y : null
        });
      }
    }
  }
  const existait = await prisma.scrutin.findUnique({ where: { id: s.uid }, select: { id: true } });
  await prisma.scrutin.upsert({ where: { id: s.uid }, create: { id: s.uid, ...data }, update: data });
  await ensureElusFantomes([...votes.keys()], "AN", null);
  await ecrireDetail(s.uid, [...analyses.values()], [...votes.values()]);
  return { id: s.uid, cree: !existait, votes: votes.size };
}
async function upsertScrutinSenat(session, meta, votes, groupeAuDate, checksum) {
  var _a;
  const id = `SEN-${session}-${meta.numero}`;
  const compte = { POUR: 0, CONTRE: 0, ABSTENTION: 0, NON_VOTANT: 0 };
  const parGroupe = /* @__PURE__ */ new Map();
  const rows = /* @__PURE__ */ new Map();
  for (const v of votes) {
    if (rows.has(v.eluId)) continue;
    compte[v.position]++;
    const groupeId = groupeAuDate(v.eluId, meta.date);
    rows.set(v.eluId, {
      scrutinId: id,
      eluId: v.eluId,
      groupeId,
      position: v.position,
      parDelegation: false,
      cause: null
    });
    if (groupeId) {
      const gc = (_a = parGroupe.get(groupeId)) != null ? _a : { pour: 0, contre: 0, abstentions: 0, nonVotants: 0 };
      if (v.position === "POUR") gc.pour++;
      else if (v.position === "CONTRE") gc.contre++;
      else if (v.position === "ABSTENTION") gc.abstentions++;
      else gc.nonVotants++;
      parGroupe.set(groupeId, gc);
    }
  }
  const exprimes = compte.POUR + compte.CONTRE;
  const data = {
    chambre: "SENAT",
    numero: String(meta.numero),
    numeroInt: meta.numero,
    legislature: null,
    session: `${session}-${session + 1}`,
    date: meta.date,
    titre: meta.objet || `Scrutin n\xB0${meta.numero}`,
    objet: meta.objet || null,
    demandeur: null,
    typeVoteCode: null,
    typeVoteLibelle: null,
    sortCode: meta.sortCode,
    sortLibelle: meta.sortCode === "adopt\xE9" ? "Le S\xE9nat a adopt\xE9" : "Le S\xE9nat n'a pas adopt\xE9",
    nombreVotants: compte.POUR + compte.CONTRE + compte.ABSTENTION,
    suffragesExprimes: exprimes,
    nbrSuffragesRequis: Math.floor(exprimes / 2) + 1,
    pour: compte.POUR,
    contre: compte.CONTRE,
    abstentions: compte.ABSTENTION,
    nonVotants: compte.NON_VOTANT,
    sourceChecksum: checksum,
    majAt: /* @__PURE__ */ new Date()
  };
  const analyses = [...parGroupe.entries()].map(([groupeId, gc]) => ({
    scrutinId: id,
    groupeId,
    nombreMembres: null,
    positionMajoritaire: gc.pour >= gc.contre && gc.pour >= gc.abstentions ? "pour" : gc.contre >= gc.abstentions ? "contre" : "abstention",
    ...gc
  }));
  const existait = await prisma.scrutin.findUnique({ where: { id }, select: { id: true } });
  await prisma.scrutin.upsert({ where: { id }, create: { id, ...data }, update: data });
  await ensureElusFantomes([...rows.keys()], "SENAT", null);
  await ecrireDetail(id, analyses, [...rows.values()]);
  return { id, cree: !existait, votes: rows.size };
}
async function ecrireDetail(scrutinId, analyses, votes) {
  const groupeIds = await groupesConnus();
  await prisma.scrutinGroupe.deleteMany({ where: { scrutinId } });
  await prisma.voteNominatif.deleteMany({ where: { scrutinId } });
  const a = analyses.filter((x) => groupeIds.has(x.groupeId));
  if (a.length) await prisma.scrutinGroupe.createMany({ data: a });
  const v = votes.map((x) => x.groupeId && groupeIds.has(x.groupeId) ? x : { ...x, groupeId: null });
  await chunked(v, (part) => prisma.voteNominatif.createMany({ data: part }));
}
async function debuterRun(source) {
  const run = await prisma.ingestRun.create({ data: { source } });
  return run.id;
}
async function terminerRun(id, res) {
  var _a, _b, _c, _d;
  await prisma.ingestRun.update({
    where: { id },
    data: {
      finishedAt: /* @__PURE__ */ new Date(),
      ok: res.ok,
      nbNouveaux: (_a = res.nbNouveaux) != null ? _a : 0,
      nbMaj: (_b = res.nbMaj) != null ? _b : 0,
      message: (_c = res.message) != null ? _c : null,
      erreur: (_d = res.erreur) != null ? _d : null
    }
  });
}
async function synchronisationEnCours(minutes = 20) {
  const depuis = new Date(Date.now() - minutes * 6e4);
  const n = await prisma.ingestRun.count({
    where: { source: "SYNC", finishedAt: null, startedAt: { gt: depuis } }
  });
  return n > 0;
}

const SEUIL = { SOLENNEL: 10, TOUS: 200 };
const PART_NEUTRALISEE_MAX = 0.3;
const PERIMETRES = [
  { nom: "SOLENNEL", filtreSql: `s."typeVoteCode" IN ('SPS','MOC')` },
  { nom: "TOUS", filtreSql: `TRUE` }
];
async function calculerPresence() {
  var _a;
  console.log("\n\u25B8 Votes en personne (Assembl\xE9e nationale)");
  const lignes = [];
  for (const p of PERIMETRES) {
    const comptes = /* @__PURE__ */ new Map();
    const eligibles = await prisma.$queryRawUnsafe(`
      SELECT a."eluId" AS "eluId", count(DISTINCT s.id) AS n
      FROM "AppartenanceGroupe" a
      JOIN "Elu" e ON e.id = a."eluId" AND e.chambre = 'AN'
      JOIN "Scrutin" s
        ON s.chambre = 'AN'
       AND (a."dateDebut" IS NULL OR s.date >= a."dateDebut")
       AND (a."dateFin"   IS NULL OR s.date <= a."dateFin")
       AND ${p.filtreSql}
      GROUP BY a."eluId"
    `);
    for (const r of eligibles) {
      comptes.set(r.eluId, { eligibles: Number(r.n), neutralises: 0, personnels: 0, delegations: 0 });
    }
    const votes = await prisma.$queryRawUnsafe(`
      SELECT v."eluId" AS "eluId",
             count(*) FILTER (WHERE v.position <> 'NON_VOTANT' AND v."parDelegation" = false) AS personnels,
             count(*) FILTER (WHERE v.position  = 'NON_VOTANT')                              AS neutralises,
             count(*) FILTER (WHERE v."parDelegation" = true)                                AS delegations
      FROM "VoteNominatif" v
      JOIN "Scrutin" s ON s.id = v."scrutinId" AND s.chambre = 'AN' AND ${p.filtreSql}
      GROUP BY v."eluId"
    `);
    for (const r of votes) {
      const c = (_a = comptes.get(r.eluId)) != null ? _a : { eligibles: 0, neutralises: 0, personnels: 0, delegations: 0 };
      c.personnels = Number(r.personnels);
      c.neutralises = Number(r.neutralises);
      c.delegations = Number(r.delegations);
      c.eligibles = Math.max(c.eligibles, c.personnels + c.neutralises);
      comptes.set(r.eluId, c);
    }
    for (const [eluId, c] of comptes) {
      const denominateur = c.eligibles - c.neutralises;
      let applicable = true;
      let motif = null;
      let taux = null;
      if (c.eligibles > 0 && c.neutralises / c.eligibles > PART_NEUTRALISEE_MAX) {
        applicable = false;
        motif = "fonction-institutionnelle";
      } else if (denominateur < SEUIL[p.nom]) {
        applicable = false;
        motif = "trop-peu-de-scrutins";
      } else {
        taux = Math.round(c.personnels / denominateur * 1e3) / 10;
      }
      lignes.push({
        eluId,
        perimetre: p.nom,
        eligibles: c.eligibles,
        neutralises: c.neutralises,
        personnels: c.personnels,
        delegations: c.delegations,
        taux,
        applicable,
        motif
      });
    }
  }
  await prisma.statPresence.deleteMany({});
  for (let i = 0; i < lignes.length; i += 2e3) {
    await prisma.statPresence.createMany({ data: lignes.slice(i, i + 2e3) });
  }
  await prisma.statDistribution.deleteMany({});
  for (const p of PERIMETRES) {
    const taux = lignes.filter((l) => l.perimetre === p.nom && l.applicable && l.taux !== null).map((l) => l.taux).sort((a, b) => a - b);
    if (taux.length < 10) continue;
    const q = (f) => taux[Math.min(taux.length - 1, Math.floor(f * (taux.length - 1)))];
    await prisma.statDistribution.create({
      data: {
        chambre: "AN",
        perimetre: p.nom,
        nbElus: taux.length,
        mediane: q(0.5),
        p10: q(0.1),
        p90: q(0.9)
      }
    });
    console.log(
      `  ${p.nom.padEnd(9)} ${taux.length} d\xE9put\xE9s \u2014 m\xE9diane ${q(0.5).toFixed(1)} % (p10 ${q(0.1).toFixed(1)} %, p90 ${q(0.9).toFixed(1)} %)`
    );
  }
  const nonApplicables = lignes.filter((l) => !l.applicable).length;
  console.log(`  \u2713 ${lignes.length} lignes calcul\xE9es (${nonApplicables} indicateurs non applicables)`);
}

async function reindexerRecherche() {
  var _a, _b, _c, _d, _e, _f;
  console.log("\n\u25B8 Index de recherche");
  const [elus, groupes, scrutins] = await Promise.all([
    prisma.elu.findMany({
      select: { slug: true, prenom: true, nom: true, chambre: true, actif: true, departement: true, groupe: { select: { code: true } } }
    }),
    prisma.groupe.findMany({ select: { id: true, chambre: true, libelle: true, libelleAbrege: true, code: true } }),
    prisma.scrutin.findMany({ select: { id: true, chambre: true, numero: true, date: true, titre: true, sortCode: true } })
  ]);
  const rows = [];
  for (const e of elus) {
    rows.push({
      type: "elu",
      ref: e.slug,
      chambre: e.chambre,
      label: `${e.prenom} ${e.nom}`.trim(),
      sub: [
        e.actif ? termeElu(e.chambre) : `ancien ${termeElu(e.chambre)}`,
        (_a = e.groupe) == null ? void 0 : _a.code,
        e.departement
      ].filter(Boolean).join(" \xB7 "),
      actif: e.actif
    });
  }
  for (const g of groupes) {
    rows.push({
      type: "groupe",
      ref: g.id,
      chambre: g.chambre,
      label: g.libelle,
      sub: ["Groupe", (_c = (_b = CHAMBRE_META[g.chambre]) == null ? void 0 : _b.label) != null ? _c : g.chambre, (_d = g.libelleAbrege) != null ? _d : g.code].filter(Boolean).join(" \xB7 "),
      actif: true
    });
  }
  for (const s of scrutins) {
    rows.push({
      type: "scrutin",
      ref: s.id,
      chambre: s.chambre,
      label: s.titre,
      sub: `Scrutin n\xB0${s.numero} \xB7 ${(_f = (_e = CHAMBRE_META[s.chambre]) == null ? void 0 : _e.labelCourt) != null ? _f : s.chambre} \xB7 ${s.date.toISOString().slice(0, 10)} \xB7 ${s.sortCode}`,
      actif: true
    });
  }
  await prisma.$executeRawUnsafe("TRUNCATE public.search_index");
  const LOT = 1e3;
  for (let i = 0; i < rows.length; i += LOT) {
    const part = rows.slice(i, i + LOT);
    const valeurs = part.map((_, k) => `($${k * 6 + 1},$${k * 6 + 2},$${k * 6 + 3},$${k * 6 + 4},$${k * 6 + 5},$${k * 6 + 6})`).join(",");
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.search_index (type, ref, chambre, label, sub, actif) VALUES ${valeurs}
       ON CONFLICT (type, ref) DO NOTHING`,
      ...part.flatMap((r) => [r.type, r.ref, r.chambre, r.label, r.sub, r.actif])
    );
  }
  await prisma.$executeRawUnsafe("ANALYZE public.search_index");
  console.log(`  \u2713 ${elus.length} \xE9lus, ${groupes.length} groupes, ${scrutins.length} scrutins index\xE9s`);
}

var _a;
const FULL = process.env.SYNC_FULL === "1";
const FORCE = process.env.INGEST_FORCE === "1";
const CHAMBRE = (_a = process.env.SYNC_CHAMBRE) == null ? void 0 : _a.toUpperCase();
const MAX = process.env.SYNC_MAX ? Number.parseInt(process.env.SYNC_MAX, 10) : 0;
const CONCURRENCE = 6;
async function enLots(items, n, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += n) {
    out.push(...await Promise.all(items.slice(i, i + n).map(fn)));
  }
  return out;
}
async function syncAN() {
  var _a2;
  console.log("\n\u25B8 Assembl\xE9e nationale");
  let nouveaux = 0;
  let maj = 0;
  const ref = await anReferentiel(FORCE);
  await upsertGroupes(ref.groupes, "AN", AN_LEGISLATURE);
  await upsertElus(ref.elus, "AN", AN_LEGISLATURE);
  const nbApp = await replaceAppartenances(ref.appartenances, "AN");
  console.log(`  r\xE9f\xE9rentiel : ${ref.groupes.length} groupes, ${ref.elus.length} d\xE9put\xE9s, ${nbApp} mandats`);
  const head = await anZipHead();
  const enBase = await prisma.scrutin.findMany({
    where: { chambre: "AN" },
    select: { id: true, sourceChecksum: true }
  });
  const checksums = new Map(enBase.map((s) => [s.id, s.sourceChecksum]));
  if (!FULL && head.total === checksums.size) {
    console.log(`  ${head.total} scrutins publi\xE9s, autant en base \u2014 rien de neuf`);
    return { nouveaux, maj };
  }
  const { entries } = await anManifest(head);
  console.log(`  manifeste : ${entries.length} scrutins publi\xE9s, ${checksums.size} en base`);
  let aTraiter = entries.filter((e) => {
    const id = `VTANR5L17V${e.numero}`;
    if (!checksums.has(id)) return true;
    return checksums.get(id) !== e.crc;
  });
  aTraiter.sort((a, b) => b.numero - a.numero);
  if (MAX > 0) aTraiter = aTraiter.slice(0, MAX);
  if (!aTraiter.length) {
    console.log("  aucun scrutin nouveau ni corrig\xE9");
    return { nouveaux, maj };
  }
  console.log(`  ${aTraiter.length} scrutin(s) \xE0 traiter`);
  if (aTraiter.length > 600) {
    const voulus = new Set(aTraiter.map((e) => e.numero));
    const crcParNumero = new Map(aTraiter.map((e) => [e.numero, e.crc]));
    console.log("  \u2192 t\xE9l\xE9chargement complet du zip (plus efficace \xE0 ce volume)");
    const scrutins = await anAllScrutins(FORCE, (n) => voulus.has(n), head.total);
    let i = 0;
    for (const s of scrutins) {
      if (!(s == null ? void 0 : s.uid)) continue;
      const r = await upsertScrutinAN(s, (_a2 = crcParNumero.get(Number(s.numero))) != null ? _a2 : null);
      r.cree ? nouveaux++ : maj++;
      if (++i % 500 === 0) console.log(`    \u2026 ${i}/${scrutins.length}`);
    }
  } else {
    const resultats = await enLots(aTraiter, CONCURRENCE, async (e) => {
      const s = await anFetchScrutin(e, head);
      return { s, crc: e.crc };
    });
    for (const { s, crc } of resultats) {
      if (!(s == null ? void 0 : s.uid)) continue;
      const r = await upsertScrutinAN(s, crc);
      r.cree ? nouveaux++ : maj++;
    }
  }
  console.log(`  \u2713 ${nouveaux} nouveaux, ${maj} mis \xE0 jour`);
  return { nouveaux, maj };
}
async function syncSenat() {
  var _a2;
  console.log("\n\u25B8 S\xE9nat");
  let nouveaux = 0;
  let maj = 0;
  const codesDepartement = /* @__PURE__ */ new Map();
  for (const r of await prisma.elu.findMany({
    where: { chambre: "AN", numDepartement: { not: null }, departement: { not: null } },
    select: { departement: true, numDepartement: true },
    distinct: ["numDepartement"]
  })) {
    codesDepartement.set(cleDepartement(r.departement), r.numDepartement);
  }
  const ref = await senatReferentiel(FORCE, codesDepartement);
  await upsertGroupes(ref.groupes, "SENAT", null);
  await upsertElus(ref.elus, "SENAT", null);
  const nbApp = await replaceAppartenances(ref.appartenances, "SENAT");
  const actifs = ref.elus.filter((e) => e.actif).length;
  console.log(`  r\xE9f\xE9rentiel : ${ref.groupes.length} groupes, ${ref.elus.length} s\xE9nateurs (${actifs} actifs), ${nbApp} appartenances`);
  const appart = await prisma.appartenanceGroupe.findMany({
    where: { elu: { chambre: "SENAT" } },
    select: { eluId: true, groupeId: true, dateDebut: true, dateFin: true }
  });
  const parElu = /* @__PURE__ */ new Map();
  for (const a of appart) {
    const arr = (_a2 = parElu.get(a.eluId)) != null ? _a2 : [];
    arr.push(a);
    parElu.set(a.eluId, arr);
  }
  const groupeCourant = new Map(
    (await prisma.elu.findMany({ where: { chambre: "SENAT" }, select: { id: true, groupeId: true } })).map(
      (e) => [e.id, e.groupeId]
    )
  );
  const groupeAuDate = (eluId, date) => {
    var _a3, _b;
    for (const a of (_a3 = parElu.get(eluId)) != null ? _a3 : []) {
      const apres = !a.dateDebut || a.dateDebut <= date;
      const avant = !a.dateFin || a.dateFin >= date;
      if (apres && avant) return a.groupeId;
    }
    return (_b = groupeCourant.get(eluId)) != null ? _b : null;
  };
  const sessions = process.env.SENAT_SESSIONS ? process.env.SENAT_SESSIONS.split(",").map((s) => Number.parseInt(s.trim(), 10)) : [senatSessionCourante()];
  for (const session of sessions) {
    const liste = await senatListeSession(session);
    const enBase = new Set(
      (await prisma.scrutin.findMany({
        where: { chambre: "SENAT", session: `${session}-${session + 1}` },
        select: { id: true }
      })).map((s) => s.id)
    );
    let aTraiter = FULL ? liste : liste.filter((m) => !enBase.has(`SEN-${session}-${m.numero}`));
    aTraiter.sort((a, b) => b.numero - a.numero);
    if (MAX > 0) aTraiter = aTraiter.slice(0, MAX);
    console.log(`  session ${session}-${session + 1} : ${liste.length} publi\xE9s, ${enBase.size} en base, ${aTraiter.length} \xE0 traiter`);
    const lots = await enLots(aTraiter, CONCURRENCE, async (m) => ({ m, res: await senatVotes(session, m.numero) }));
    let i = 0;
    for (const { m, res } of lots) {
      if (!res || !res.votes.length) {
        console.warn(`    \u26A0 scrutin ${session}-${m.numero} : aucun vote r\xE9cup\xE9r\xE9, ignor\xE9`);
        continue;
      }
      const r = await upsertScrutinSenat(session, m, res.votes, groupeAuDate, res.lastModified);
      r.cree ? nouveaux++ : maj++;
      if (++i % 100 === 0) console.log(`    \u2026 ${i}/${lots.length}`);
    }
  }
  console.log(`  \u2713 ${nouveaux} nouveaux, ${maj} mis \xE0 jour`);
  return { nouveaux, maj };
}
async function synchroniser() {
  const t0 = Date.now();
  const runId = await debuterRun("SYNC");
  let nouveaux = 0;
  let maj = 0;
  const messages = [];
  try {
    if (!CHAMBRE || CHAMBRE === "AN") {
      const r = await syncAN();
      nouveaux += r.nouveaux;
      maj += r.maj;
      messages.push(`AN +${r.nouveaux}/~${r.maj}`);
    }
    if (!CHAMBRE || CHAMBRE === "SENAT") {
      const r = await syncSenat();
      nouveaux += r.nouveaux;
      maj += r.maj;
      messages.push(`S\xE9nat +${r.nouveaux}/~${r.maj}`);
    }
    await calculerPresence();
    await reindexerRecherche();
    await terminerRun(runId, { ok: true, nbNouveaux: nouveaux, nbMaj: maj, message: messages.join(" \xB7 ") });
    console.log(`
\u2705 Synchronisation termin\xE9e en ${((Date.now() - t0) / 1e3).toFixed(0)}s \u2014 ${messages.join(" \xB7 ")}`);
    return { ok: true, nouveaux, maj, message: messages.join(" \xB7 ") };
  } catch (err) {
    const e = err;
    await terminerRun(runId, { ok: false, nbNouveaux: nouveaux, nbMaj: maj, erreur: e.message });
    throw e;
  }
}

export { synchronisationEnCours, synchroniser };
//# sourceMappingURL=sync-runtime.mjs.map
