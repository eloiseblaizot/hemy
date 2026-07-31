import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { d as departements } from '../../_/queries.mjs';
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

const index_get = defineEventHandler(async () => {
  return { items: await departements() };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
