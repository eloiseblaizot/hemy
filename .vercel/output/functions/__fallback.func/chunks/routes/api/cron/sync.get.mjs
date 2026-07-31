import { d as defineEventHandler, s as setHeader, c as createError, a as getHeader } from '../../../nitro/nitro.mjs';
import { timingSafeEqual } from 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';

function memeSecret(recu, attendu) {
  const a = Buffer.from(recu);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}
const sync_get = defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: "CRON_SECRET non configur\xE9" });
  }
  const entete = getHeader(event, "authorization") || "";
  if (!memeSecret(entete, `Bearer ${secret}`)) {
    throw createError({ statusCode: 401, statusMessage: "Non autoris\xE9" });
  }
  const { synchroniser, synchronisationEnCours } = await import('../../../_/sync-runtime.mjs');
  if (await synchronisationEnCours()) {
    return { ok: true, ignore: true, motif: "synchronisation d\xE9j\xE0 en cours" };
  }
  try {
    const res = await synchroniser();
    return { ok: true, ...res };
  } catch (err) {
    const e = err;
    console.error("[cron/sync]", e);
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});

export { sync_get as default };
//# sourceMappingURL=sync.get.mjs.map
