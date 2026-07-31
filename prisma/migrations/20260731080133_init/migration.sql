-- CreateEnum
CREATE TYPE "PositionVote" AS ENUM ('POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT');

-- CreateTable
CREATE TABLE "Elu" (
    "id" TEXT NOT NULL,
    "chambre" TEXT NOT NULL,
    "civilite" TEXT,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dateNaissance" DATE,
    "profession" TEXT,
    "region" TEXT,
    "departement" TEXT,
    "numDepartement" TEXT,
    "numCirco" TEXT,
    "photoUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "legislature" TEXT,
    "groupeId" TEXT,
    "roleGroupe" TEXT,

    CONSTRAINT "Elu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Groupe" (
    "id" TEXT NOT NULL,
    "chambre" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "libelleAbrege" TEXT,
    "couleur" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "legislature" TEXT,

    CONSTRAINT "Groupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppartenanceGroupe" (
    "id" SERIAL NOT NULL,
    "eluId" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "dateDebut" DATE,
    "dateFin" DATE,
    "fonction" TEXT,

    CONSTRAINT "AppartenanceGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scrutin" (
    "id" TEXT NOT NULL,
    "chambre" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "numeroInt" INTEGER NOT NULL DEFAULT 0,
    "legislature" TEXT,
    "session" TEXT,
    "date" DATE NOT NULL,
    "titre" TEXT NOT NULL,
    "objet" TEXT,
    "demandeur" TEXT,
    "typeVoteCode" TEXT,
    "typeVoteLibelle" TEXT,
    "sortCode" TEXT NOT NULL,
    "sortLibelle" TEXT,
    "nombreVotants" INTEGER NOT NULL DEFAULT 0,
    "suffragesExprimes" INTEGER,
    "nbrSuffragesRequis" INTEGER,
    "pour" INTEGER NOT NULL DEFAULT 0,
    "contre" INTEGER NOT NULL DEFAULT 0,
    "abstentions" INTEGER NOT NULL DEFAULT 0,
    "nonVotants" INTEGER NOT NULL DEFAULT 0,
    "sourceChecksum" TEXT,
    "majAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scrutin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrutinGroupe" (
    "id" SERIAL NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "nombreMembres" INTEGER,
    "positionMajoritaire" TEXT,
    "pour" INTEGER NOT NULL DEFAULT 0,
    "contre" INTEGER NOT NULL DEFAULT 0,
    "abstentions" INTEGER NOT NULL DEFAULT 0,
    "nonVotants" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScrutinGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteNominatif" (
    "scrutinId" TEXT NOT NULL,
    "eluId" TEXT NOT NULL,
    "groupeId" TEXT,
    "position" "PositionVote" NOT NULL,
    "parDelegation" BOOLEAN NOT NULL DEFAULT false,
    "cause" VARCHAR(8),

    CONSTRAINT "VoteNominatif_pkey" PRIMARY KEY ("scrutinId","eluId")
);

-- CreateTable
CREATE TABLE "StatPresence" (
    "eluId" TEXT NOT NULL,
    "perimetre" TEXT NOT NULL,
    "eligibles" INTEGER NOT NULL,
    "neutralises" INTEGER NOT NULL,
    "personnels" INTEGER NOT NULL,
    "delegations" INTEGER NOT NULL,
    "taux" DOUBLE PRECISION,
    "applicable" BOOLEAN NOT NULL DEFAULT true,
    "motif" TEXT,
    "calculeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatPresence_pkey" PRIMARY KEY ("eluId","perimetre")
);

-- CreateTable
CREATE TABLE "StatDistribution" (
    "chambre" TEXT NOT NULL,
    "perimetre" TEXT NOT NULL,
    "nbElus" INTEGER NOT NULL,
    "mediane" DOUBLE PRECISION NOT NULL,
    "p10" DOUBLE PRECISION NOT NULL,
    "p90" DOUBLE PRECISION NOT NULL,
    "calculeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatDistribution_pkey" PRIMARY KEY ("chambre","perimetre")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "nbNouveaux" INTEGER NOT NULL DEFAULT 0,
    "nbMaj" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "erreur" TEXT,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Elu_slug_key" ON "Elu"("slug");

-- CreateIndex
CREATE INDEX "Elu_chambre_idx" ON "Elu"("chambre");

-- CreateIndex
CREATE INDEX "Elu_numDepartement_idx" ON "Elu"("numDepartement");

-- CreateIndex
CREATE INDEX "Elu_groupeId_idx" ON "Elu"("groupeId");

-- CreateIndex
CREATE INDEX "Elu_nom_idx" ON "Elu"("nom");

-- CreateIndex
CREATE INDEX "Groupe_chambre_idx" ON "Groupe"("chambre");

-- CreateIndex
CREATE INDEX "AppartenanceGroupe_eluId_idx" ON "AppartenanceGroupe"("eluId");

-- CreateIndex
CREATE INDEX "AppartenanceGroupe_groupeId_idx" ON "AppartenanceGroupe"("groupeId");

-- CreateIndex
CREATE INDEX "Scrutin_chambre_date_idx" ON "Scrutin"("chambre", "date");

-- CreateIndex
CREATE INDEX "Scrutin_date_idx" ON "Scrutin"("date");

-- CreateIndex
CREATE INDEX "Scrutin_chambre_typeVoteCode_idx" ON "Scrutin"("chambre", "typeVoteCode");

-- CreateIndex
CREATE UNIQUE INDEX "ScrutinGroupe_scrutinId_groupeId_key" ON "ScrutinGroupe"("scrutinId", "groupeId");

-- CreateIndex
CREATE INDEX "VoteNominatif_eluId_idx" ON "VoteNominatif"("eluId");

-- CreateIndex
CREATE INDEX "StatPresence_perimetre_idx" ON "StatPresence"("perimetre");

-- CreateIndex
CREATE INDEX "IngestRun_source_startedAt_idx" ON "IngestRun"("source", "startedAt");

-- AddForeignKey
ALTER TABLE "Elu" ADD CONSTRAINT "Elu_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppartenanceGroupe" ADD CONSTRAINT "AppartenanceGroupe_eluId_fkey" FOREIGN KEY ("eluId") REFERENCES "Elu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppartenanceGroupe" ADD CONSTRAINT "AppartenanceGroupe_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrutinGroupe" ADD CONSTRAINT "ScrutinGroupe_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrutinGroupe" ADD CONSTRAINT "ScrutinGroupe_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteNominatif" ADD CONSTRAINT "VoteNominatif_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteNominatif" ADD CONSTRAINT "VoteNominatif_eluId_fkey" FOREIGN KEY ("eluId") REFERENCES "Elu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteNominatif" ADD CONSTRAINT "VoteNominatif_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatPresence" ADD CONSTRAINT "StatPresence_eluId_fkey" FOREIGN KEY ("eluId") REFERENCES "Elu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
