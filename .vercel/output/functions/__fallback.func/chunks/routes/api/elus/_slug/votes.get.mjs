import { d as defineEventHandler, g as getRouterParam, b as getQuery, c as createError } from '../../../../nitro/nitro.mjs';
import { p as prisma } from '../../../../_/db.mjs';
import { b as eluVotes } from '../../../../_/queries.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'pg';
import '@prisma/adapter-pg';
import '../../../../_/db-url.mjs';
import 'node:url';
import '@prisma/client-runtime-utils';
import 'node:async_hooks';
import 'node:os';

const votes_get = defineEventHandler(async (event) => {
  const slug = decodeURIComponent(getRouterParam(event, "slug") || "");
  const q = getQuery(event);
  const elu = await prisma.elu.findUnique({ where: { slug }, select: { id: true } });
  if (!elu) throw createError({ statusCode: 404, statusMessage: "\xC9lu introuvable" });
  const position = typeof q.position === "string" ? q.position : void 0;
  return eluVotes(elu.id, {
    limit: Math.min(Number(q.limit) || 20, 50),
    offset: Number(q.offset) || 0,
    position
  });
});

export { votes_get as default };
//# sourceMappingURL=votes.get.mjs.map
