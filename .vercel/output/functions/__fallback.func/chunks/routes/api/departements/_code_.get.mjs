import { d as defineEventHandler, g as getRouterParam } from '../../../nitro/nitro.mjs';
import { e as elusByDepartement } from '../../../_/queries.mjs';
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

const _code__get = defineEventHandler(async (event) => {
  const code = decodeURIComponent(getRouterParam(event, "code") || "");
  return { code, elus: await elusByDepartement(code) };
});

export { _code__get as default };
//# sourceMappingURL=_code_.get.mjs.map
