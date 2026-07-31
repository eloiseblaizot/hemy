import { d as defineEventHandler, g as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { c as chambreOverview } from '../../../_/queries.mjs';
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

const _chambre__get = defineEventHandler(async (event) => {
  const raw = (getRouterParam(event, "chambre") || "").toUpperCase();
  const chambre = raw === "AN" || raw === "ASSEMBLEE-NATIONALE" ? "AN" : raw === "SENAT" ? "SENAT" : null;
  if (!chambre) throw createError({ statusCode: 404, statusMessage: "Chambre inconnue" });
  return chambreOverview(chambre);
});

export { _chambre__get as default };
//# sourceMappingURL=_chambre_.get.mjs.map
