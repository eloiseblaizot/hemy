/**
 * (Re)construit la table de recherche unifiée `search_index`.
 * Le tsvector et la colonne normalisée sont des colonnes GÉNÉRÉES : il suffit
 * d'insérer type / ref / chambre / label / sub.
 */
import { prisma } from './lib/prisma'
import { CHAMBRE_META, termeElu, type Chambre } from '../shared/types'

export async function reindexerRecherche() {
  console.log('\n▸ Index de recherche')

  const [elus, groupes, scrutins] = await Promise.all([
    prisma.elu.findMany({
      select: { slug: true, prenom: true, nom: true, chambre: true, actif: true, departement: true, groupe: { select: { code: true } } },
    }),
    prisma.groupe.findMany({ select: { id: true, chambre: true, libelle: true, libelleAbrege: true, code: true } }),
    prisma.scrutin.findMany({ select: { id: true, chambre: true, numero: true, date: true, titre: true, sortCode: true } }),
  ])

  const rows: { type: string; ref: string; chambre: string; label: string; sub: string; actif: boolean }[] = []

  for (const e of elus) {
    rows.push({
      type: 'elu',
      ref: e.slug,
      chambre: e.chambre,
      label: `${e.prenom} ${e.nom}`.trim(),
      sub: [
        e.actif ? termeElu(e.chambre as Chambre) : `ancien ${termeElu(e.chambre as Chambre)}`,
        e.groupe?.code,
        e.departement,
      ]
        .filter(Boolean)
        .join(' · '),
      actif: e.actif,
    })
  }
  for (const g of groupes) {
    rows.push({
      type: 'groupe',
      ref: g.id,
      chambre: g.chambre,
      label: g.libelle,
      sub: ['Groupe', CHAMBRE_META[g.chambre as Chambre]?.label ?? g.chambre, g.libelleAbrege ?? g.code]
        .filter(Boolean)
        .join(' · '),
      actif: true,
    })
  }
  for (const s of scrutins) {
    rows.push({
      type: 'scrutin',
      ref: s.id,
      chambre: s.chambre,
      label: s.titre,
      sub: `Scrutin n°${s.numero} · ${CHAMBRE_META[s.chambre as Chambre]?.labelCourt ?? s.chambre} · ${s.date.toISOString().slice(0, 10)} · ${s.sortCode}`,
      actif: true,
    })
  }

  await prisma.$executeRawUnsafe('TRUNCATE public.search_index')
  const LOT = 1000
  for (let i = 0; i < rows.length; i += LOT) {
    const part = rows.slice(i, i + LOT)
    const valeurs = part
      .map((_, k) => `($${k * 6 + 1},$${k * 6 + 2},$${k * 6 + 3},$${k * 6 + 4},$${k * 6 + 5},$${k * 6 + 6})`)
      .join(',')
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.search_index (type, ref, chambre, label, sub, actif) VALUES ${valeurs}
       ON CONFLICT (type, ref) DO NOTHING`,
      ...part.flatMap((r) => [r.type, r.ref, r.chambre, r.label, r.sub, r.actif]),
    )
  }
  await prisma.$executeRawUnsafe('ANALYZE public.search_index')

  console.log(`  ✓ ${elus.length} élus, ${groupes.length} groupes, ${scrutins.length} scrutins indexés`)
}
