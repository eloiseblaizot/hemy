import { d as defineEventHandler, e as getRequestHeader, s as setHeader } from '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const robots_txt = defineEventHandler((event) => {
  const host = getRequestHeader(event, "x-forwarded-host") || getRequestHeader(event, "host") || "localhost:3000";
  const proto = getRequestHeader(event, "x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = (process.env.NUXT_PUBLIC_SITE_URL || `${proto}://${host}`).replace(/\/$/, "");
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;
});

export { robots_txt as default };
//# sourceMappingURL=robots.txt.mjs.map
