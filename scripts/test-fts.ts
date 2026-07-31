// Vérifie la configuration de recherche française. `npx tsx scripts/test-fts.ts`
import 'dotenv/config'
import { Client } from 'pg'

const c = new Client({ connectionString: process.env.DIRECT_URL })
await c.connect()

const { rows: ext } = await c.query(
  `SELECT extname FROM pg_extension WHERE extname IN ('unaccent','pg_trgm') ORDER BY extname`,
)
console.log('extensions :', ext.map((r) => r.extname).join(', ') || '(aucune)')

const { rows: cfg } = await c.query(`SELECT cfgname FROM pg_ts_config WHERE cfgname = 'fr_unaccent'`)
console.log('configuration fr_unaccent :', cfg.length ? 'OK' : 'MANQUANTE')

const { rows: lex } = await c.query(
  `SELECT to_tsvector('public.fr_unaccent', $1)::text AS v`,
  ["Réforme des RETRAITES à l'Assemblée nationale"],
)
console.log('lexèmes :', lex[0].v)

const { rows: m } = await c.query(
  `SELECT to_tsvector('public.fr_unaccent', $1) @@ websearch_to_tsquery('public.fr_unaccent', $2) AS ok`,
  ["Réforme des RETRAITES à l'Assemblée nationale", 'reforme retraite'],
)
console.log('« reforme retraite » (sans accents, singulier) trouve la phrase accentuée au pluriel :', m[0].ok)

// Insertion + recherche réelles, dans une transaction annulée : l'index de
// recherche du site ne doit pas être touché par un test.
await c.query('BEGIN')
await c.query(
  `INSERT INTO public.search_index (type, ref, chambre, label, sub) VALUES
    ('__test','eloise-blaizot','AN','Éloïse Blaizot','député · EPR · Cher'),
    ('__test','V1','AN','Réforme des retraites — 2e lecture','Scrutin n°1 · adopté'),
    ('__test','G1','AN','Groupe Écologiste et Social','Groupe · Assemblée nationale')`,
)
for (const q of ['eloise', 'blaizo', 'retraite', 'ecologiste', 'ÉCOLOGISTE']) {
  const { rows } = await c.query(
    `WITH tq AS (SELECT websearch_to_tsquery('public.fr_unaccent', $1) AS q,
                        lower(public.immutable_unaccent($1)) AS n)
     SELECT s.label,
            round(ts_rank_cd(s.document, tq.q)::numeric, 3) AS fts,
            round(similarity(s.label_norm, tq.n)::numeric, 2) AS sim
     FROM public.search_index s, tq
     WHERE s.type = '__test' AND (s.document @@ tq.q OR s.label_norm %> tq.n)
     ORDER BY (ts_rank_cd(s.document, tq.q) * 4 + similarity(s.label_norm, tq.n)) DESC LIMIT 2`,
    [q],
  )
  console.log(`  « ${q} » → ${rows.map((r) => `${r.label} (fts ${r.fts}, sim ${r.sim})`).join(' | ') || 'aucun résultat'}`)
}
await c.query('ROLLBACK')
await c.end()
