-- Les élus en exercice doivent primer sur les anciens dans la recherche :
-- « braun » doit d'abord proposer la députée en exercice, pas un sénateur
-- dont le mandat s'est achevé il y a vingt ans.
ALTER TABLE public.search_index ADD COLUMN actif BOOLEAN NOT NULL DEFAULT TRUE;
