import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { g as fraicheur } from '../../_/queries.mjs';
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

const fraicheur_get = defineEventHandler(async () => {
  const { derniereMaj, runs } = await fraicheur();
  const heures = derniereMaj ? (Date.now() - derniereMaj.getTime()) / 36e5 : null;
  return {
    derniereMaj,
    runs,
    // Au-delà de 48 h sans succès, la synchronisation est probablement cassée.
    obsolete: heures === null || heures > 48
  };
});

export { fraicheur_get as default };
//# sourceMappingURL=fraicheur.get.mjs.map
