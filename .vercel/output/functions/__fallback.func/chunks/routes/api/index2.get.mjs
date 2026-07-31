import { d as defineEventHandler, b as getQuery } from '../../nitro/nitro.mjs';
import { f as elusByIds } from '../../_/queries.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const q = getQuery(event);
  const ids = typeof q.ids === "string" ? q.ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100) : [];
  return { items: await elusByIds(ids) };
});

export { index_get as default };
//# sourceMappingURL=index2.get.mjs.map
