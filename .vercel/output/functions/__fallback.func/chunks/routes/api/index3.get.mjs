import { d as defineEventHandler, b as getQuery } from '../../nitro/nitro.mjs';
import { l as latestScrutins, i as countScrutins } from '../../_/queries.mjs';
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
  const chambre = typeof q.chambre === "string" ? q.chambre.toUpperCase() : void 0;
  const limit = Math.min(Number(q.limit) || 20, 100);
  const offset = Number(q.offset) || 0;
  const [items, total] = await Promise.all([
    latestScrutins({ chambre, limit, offset }),
    countScrutins(chambre)
  ]);
  return { items, total };
});

export { index_get as default };
//# sourceMappingURL=index3.get.mjs.map
