-- Recherche plein-texte française, insensible aux accents.
-- Remplace la table virtuelle FTS5 de SQLite (sans équivalent en Postgres).
--
-- Deux mécanismes complémentaires :
--   * tsvector + GIN sur une configuration `french` étendue par `unaccent`
--     (gère accents ET radicaux : « retraites » -> « retrait »)
--   * trigrammes sur le libellé normalisé, pour tolérer les fautes de frappe
--     (« blaizo » trouve « Blaizot », que le tsvector seul ne rattrape pas)

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Configuration de recherche française sans accents.
DROP TEXT SEARCH CONFIGURATION IF EXISTS public.fr_unaccent;
CREATE TEXT SEARCH CONFIGURATION public.fr_unaccent (COPY = pg_catalog.french);
ALTER TEXT SEARCH CONFIGURATION public.fr_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;

-- `unaccent(text)` est STABLE et ne peut donc pas servir dans une colonne
-- générée : ce wrapper à dictionnaire explicite est IMMUTABLE.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
  $$ SELECT unaccent('unaccent'::regdictionary, $1) $$;

-- Table de recherche unifiée (élus, groupes, scrutins).
CREATE TABLE public.search_index (
  id       BIGSERIAL PRIMARY KEY,
  type     TEXT NOT NULL,               -- 'elu' | 'groupe' | 'scrutin'
  ref      TEXT NOT NULL,               -- slug d'élu / id de groupe / id de scrutin
  chambre  TEXT NOT NULL,
  label    TEXT NOT NULL,
  sub      TEXT NOT NULL DEFAULT '',
  -- Forme à 2 arguments : la seule immutable, elle applique `unaccent` via le
  -- dictionnaire de la configuration.
  document TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('public.fr_unaccent', coalesce(label, '')), 'A') ||
    setweight(to_tsvector('public.fr_unaccent', coalesce(sub, '')), 'B')
  ) STORED,
  -- `unaccent` AVANT `lower` : en locale C, lower('É') ne minuscule pas.
  label_norm TEXT GENERATED ALWAYS AS (lower(public.immutable_unaccent(label))) STORED
);

CREATE INDEX search_index_document_idx ON public.search_index USING GIN (document);
CREATE INDEX search_index_trgm_idx ON public.search_index USING GIN (label_norm gin_trgm_ops);
CREATE INDEX search_index_type_idx ON public.search_index (type);
CREATE UNIQUE INDEX search_index_type_ref_key ON public.search_index (type, ref);
