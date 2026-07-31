import { d as defineEventHandler, g as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { s as scrutinDetail } from '../../../_/queries.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const id = decodeURIComponent(getRouterParam(event, "id") || "");
  const data = await scrutinDetail(id);
  if (!data) throw createError({ statusCode: 404, statusMessage: "Scrutin introuvable" });
  return data;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
