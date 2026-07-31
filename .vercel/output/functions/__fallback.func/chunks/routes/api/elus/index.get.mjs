import { d as defineEventHandler, g as getRouterParam, b as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { a as eluBySlug, b as eluVotes } from '../../../_/queries.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../../../_/db.mjs';
import 'pg';
import '@prisma/adapter-pg';
import '../../../_/db-url.mjs';
import 'node:url';
import '@prisma/client-runtime-utils';
import 'node:async_hooks';
import 'node:os';

const index_get = defineEventHandler(async (event) => {
  const slug = decodeURIComponent(getRouterParam(event, "slug") || "");
  const q = getQuery(event);
  const data = await eluBySlug(slug);
  if (!data) throw createError({ statusCode: 404, statusMessage: "\xC9lu introuvable" });
  const position = typeof q.position === "string" ? q.position : void 0;
  const { votes, total } = await eluVotes(data.elu.id, { limit: 20, offset: 0, position });
  return { ...data, votes, votesTotal: total };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
