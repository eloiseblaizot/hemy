import { d as defineEventHandler, b as getQuery } from '../../nitro/nitro.mjs';
import { j as searchAll } from '../../_/queries.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../../_/db.mjs';
import 'pg';
import '@prisma/adapter-pg';
import '../../_/db-url.mjs';
import 'node:url';
import '@prisma/client-runtime-utils';
import 'node:async_hooks';
import 'node:os';

const search_get = defineEventHandler(async (event) => {
  const q = getQuery(event);
  const term = typeof q.q === "string" ? q.q : "";
  const limit = Math.min(Number(q.limit) || 20, 40);
  if (term.trim().length < 2) return { results: [] };
  return { results: await searchAll(term, limit) };
});

export { search_get as default };
//# sourceMappingURL=search.get.mjs.map
