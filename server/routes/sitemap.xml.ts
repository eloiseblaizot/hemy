// Sitemap dynamique (scrutins, élus, groupes). Nitro sert ce fichier à /sitemap.xml
export default defineEventHandler(async (event) => {
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || 'localhost:3000'
  const proto = getRequestHeader(event, 'x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const base = (process.env.NUXT_PUBLIC_SITE_URL || `${proto}://${host}`).replace(/\/$/, '')

  const [scrutins, elus, groupes] = await Promise.all([
    prisma.scrutin.findMany({ select: { id: true, date: true }, orderBy: { date: 'desc' }, take: 20000 }),
    prisma.elu.findMany({ where: { actif: true }, select: { slug: true, chambre: true } }),
    prisma.groupe.findMany({ select: { id: true } }),
  ])

  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: '/', priority: '1.0' },
    { loc: '/chambre/assemblee-nationale', priority: '0.9' },
    { loc: '/chambre/senat', priority: '0.9' },
    { loc: '/mes-elus', priority: '0.6' },
    ...groupes.map((g) => ({ loc: `/groupes/${encodeURIComponent(g.id)}`, priority: '0.7' })),
    ...elus.map((e) => ({
      loc: `${e.chambre === 'SENAT' ? '/senateurs' : '/deputes'}/${encodeURIComponent(e.slug)}`,
      priority: '0.8',
    })),
    ...scrutins.map((s) => ({
      loc: `/scrutins/${encodeURIComponent(s.id)}`,
      lastmod: s.date.toISOString().slice(0, 10),
      priority: '0.5',
    })),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${base}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=86400')
  return body
})
