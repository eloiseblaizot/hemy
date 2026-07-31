# Hemy

Visualisation des **scrutins publics de l'Assemblée nationale et du Sénat** :
hémicycle, analyse par groupe, recherche unifiée, suivi de « mes élus » (sans
compte), et indicateur de votes en personne.

Site indépendant, non officiel. Données sous **Licence Ouverte / Etalab**.

---

## Stack

- **Nuxt 4** (Vue 3, Nitro) + **Tailwind CSS v4**
- **Prisma 7** + **PostgreSQL** (adapter `@prisma/adapter-pg`)
- Recherche plein-texte **Postgres** : `tsvector` + GIN sur une configuration
  française désaccentuée, complétée par des trigrammes (tolérance aux fautes)
- Mise à jour quotidienne automatique via **GitHub Actions** (+ cron Vercel en
  filet de sécurité)

## Démarrage local

Aucun Docker requis : un vrai PostgreSQL 18 est fourni par `embedded-postgres`.

```bash
npm install
cp .env.example .env
npm run db:dev          # démarre Postgres en local (à laisser tourner)
```

Dans un second terminal :

```bash
npm run db:deploy       # applique les migrations
npm run sync:full       # charge toutes les données (~2 min)
npm run dev             # http://localhost:3000
```

## Mise à jour des données

La synchronisation fonctionne par **réconciliation d'ensembles** : elle compare
les scrutins publiés à ceux en base. Elle est donc insensible à une exécution
manquée comme à une exécution dupliquée, et comble les trous de l'historique.

```bash
npm run sync            # incrémental (ce que fait le cron quotidien)
npm run sync:full       # recharge tout
npm run presence        # recalcule le seul indicateur de votes en personne
npm run search:reindex  # reconstruit l'index de recherche
npm run stats           # état de la base et dernières synchronisations
```

Variables utiles : `SYNC_CHAMBRE=AN|SENAT`, `SYNC_MAX=<n>`,
`SENAT_SESSIONS=2025,2024`, `INGEST_FORCE=1`.

### Coût d'une exécution quotidienne

| Source | Méthode | Volume |
| --- | --- | --- |
| Assemblée nationale | Lecture **HTTP Range** du zip : sonde de 22 octets, puis manifeste (~590 Ko) avec CRC32, puis ~5,4 Ko par scrutin nouveau | ~600 Ko |
| Sénat | Liste de session (~280 Ko) + un JSON de 19 Ko par scrutin nouveau | ~300 Ko |

Soit **~1 Mo et quelques secondes** par jour, au lieu de 41 Mo de gros fichiers.
Le CRC32 permet en plus de détecter la *correction* d'un scrutin déjà ingéré.

## Sources open data

| Donnée | Source |
| --- | --- |
| Scrutins AN | `data.assemblee-nationale.fr` → `repository/17/loi/scrutins/Scrutins.json.zip` |
| Députés, groupes, mandats | `repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30…json.zip` |
| Sénateurs, groupes | `data.senat.fr/data/senateurs/ODSEN_GENERAL.csv` + `ODSEN_HISTOGROUPES.csv` |
| Scrutins Sénat | `senat.fr/scrutin-public/scr<session>.html` + `…/scr<session>-<n>.json` |

**AMO30 et non AMO10** : AMO10 ignore les ex-députés et ne clôt jamais un
mandat, ce qui rend toute fenêtre de mandat inexploitable.
**Pas `ODSEN_ELUSEN.csv`** : le fichier est régénéré chaque jour mais reste
factuellement périmé (aucun mandat ouvert après 2023, 93 sénateurs manquants).

Les couleurs des groupes de l'AN sont officielles ; celles du Sénat ne sont pas
publiées et suivent une palette conventionnelle (`shared/groupes.ts`).

## Indicateur « votes en personne »

L'Assemblée nationale ne publie **aucun relevé de présence dans l'hémicycle**.
Ce que l'on peut compter, ce sont les votes enregistrés lors des scrutins
publics. L'indicateur est donc nommé « votes en personne », jamais « taux de
présence », et il est encadré :

```
taux = votes personnels / (scrutins du mandat − scrutins non votables)
```

- **Votes par délégation exclus** du numérateur (14,9 % des votes) : la loi ne
  les autorise qu'en cas d'empêchement, donc d'absence. Ils sont affichés
  séparément. *(L'Assemblée, elle, les compte comme de la participation à son
  article 159 : c'est dit dans la mise en garde.)*
- **Fenêtre de mandat** issue des mandats de **groupe**, pas des mandats
  `ASSEMBLEE` — ces derniers recopient leur date de début lors d'une reprise de
  mandat et gonflent le dénominateur jusqu'à ×7.
- **Non-votants institutionnels neutralisés** (présidence de l'Assemblée ou de
  séance, fonctions ministérielles) : retirés du dénominateur, jamais comptés
  comme absence ni comme participation.
- **Garde-fous** : dénominateur minimal (10 scrutins solennels, 200 tous
  scrutins) ; au-delà de 30 % de scrutins neutralisés l'indicateur est déclaré
  non applicable — sans quoi la présidente de l'Assemblée sortirait à 100 %.
- **Aucun classement n'est publié.** L'élu est situé dans la distribution
  (médiane, p10, p90).

**Aucun indicateur pour le Sénat**, et c'est une contrainte de données, pas un
choix de prudence : une position est enregistrée pour les 348 sénateurs à chaque
scrutin, présents ou non (un seul membre d'un groupe peut déposer les bulletins
de tous ses collègues). Le site l'explique sur chaque fiche de sénateur.

## Déploiement sur Vercel

### 1. Base de données

Provisionner un **Postgres** (Neon via le marketplace Vercel, ou Supabase, ou
tout autre). La base pèse ~250 Mo pour la législature complète et croît
d'environ 100 Mo par an.

Deux variables d'environnement, sur les trois environnements Vercel :

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | connexion **poolée** (`…-pooler…`) — utilisée par le site |
| `DIRECT_URL` | connexion **directe** — migrations et ingestion |
| `CRON_SECRET` | `openssl rand -hex 32` — sans lui, `/api/cron/sync` refuse tout appel |
| `NUXT_PUBLIC_SITE_URL` | (optionnel) URL publique, pour `robots.txt` et le sitemap |

Avec l'intégration Neon du marketplace Vercel, `DATABASE_URL` et
`DATABASE_URL_UNPOOLED` sont injectées automatiquement : il n'y a alors **rien à
créer à la main** hormis `CRON_SECRET`. Le code accepte aussi les variantes
`POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` (voir `shared/db-url.ts`).

### 2. Déploiement

Aucune configuration Vercel particulière : le preset Nitro est détecté
automatiquement. Le build (`scripts/vercel-build.mjs`) enchaîne
`prisma generate`, `prisma migrate deploy` (production uniquement) puis
`nuxt build`.

Le runtime, la durée maximale et la région sont fixés dans `nuxt.config.ts`
(`nitro.vercel.functions`) — et non dans `vercel.json`, car Nuxt n'émet qu'une
seule fonction.

### 3. Premier chargement

Depuis un poste, en pointant `DIRECT_URL` sur la base de production :

```bash
DIRECT_URL="postgresql://…" npm run sync:full
```

### 4. Mise à jour quotidienne

Ajouter dans le dépôt GitHub deux secrets `DATABASE_URL` et `DIRECT_URL` :
le workflow `.github/workflows/sync.yml` s'exécute alors chaque jour à 04h37 UTC
et peut être relancé à la main (*Run workflow*).

Un cron Vercel appelle en parallèle `/api/cron/sync` (protégé par `CRON_SECRET`)
à 05h20 UTC. Les deux sont idempotents et se verrouillent mutuellement : garder
les deux, ou n'en garder qu'un.

> Sur le plan Hobby, Vercel n'autorise **qu'un cron par jour** — une expression
> plus fréquente fait échouer le déploiement — ne réessaie jamais en cas
> d'échec, et peut invoquer deux fois la même exécution. C'est pourquoi la
> synchronisation est idempotente et verrouillée, et pourquoi le travail lourd
> est porté par GitHub Actions.

Le pied de page affiche la date de la dernière synchronisation réussie et
signale une interruption au-delà de 48 h.

## Structure

```
app/
  components/   Hemicycle, PresenceCard, VoteBar, ScrutinCard, EluCard, SearchBar…
  composables/  useMesElus (localStorage, sans erreur d'hydratation)
  pages/        index, scrutins/[id], deputes/[slug], senateurs/[slug],
                groupes/[id], chambre/[chambre], mes-elus
server/
  api/          scrutins, elus, groupes, chambre, search, departements,
                fraicheur, cron/sync
  routes/       robots.txt, sitemap.xml
  utils/        db (singleton Prisma), queries (couche de requêtes)
shared/         types, format, hemicycle (algorithme SVG), groupes, presence
scripts/
  lib/          an-source (Range/zip), senat-source, store, prisma, net, text
  sync.ts       orchestrateur (importé aussi par la route cron)
  compute-presence.ts, reindex-search.ts, dev-db.ts, db-stats.ts
  cli/          enveloppes en ligne de commande
prisma/         schema.prisma, migrations
```

## Notes de modélisation

- `VoteNominatif` a une **clé primaire composite** `(scrutinId, eluId)` et un
  seul index secondaire : économise ~39 Mo d'index sur 1,4 M de lignes.
- Les dates civiles sont en `@db.Date` : en `timestamp`, un scrutin du 14/03
  s'afficherait le 13/03 dans les fuseaux négatifs.
- La table `search_index` (`tsvector` généré) est gérée en SQL brut : Prisma ne
  modélise pas `tsvector`.
- Les statistiques (`StatPresence`, `StatDistribution`) sont **précalculées** à
  chaque synchronisation : agréger 1,4 M de lignes à chaque requête coûterait
  plusieurs centaines de millisecondes.
