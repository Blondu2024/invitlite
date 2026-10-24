/**
 * INVITLITE photos: the one thing that cannot live in the link.
 *
 * The editor shrinks the host's photo in the browser (which also drops EXIF,
 * GPS included) and posts it here. We keep it in Workers KV and hand back an
 * address short enough for the link and the QR code. Every photo is stored
 * with the day it must go (30 days after the event, or a year after upload
 * when the invitation has no date yet) and KV deletes it by itself then. The
 * host can also delete one at once with the key they got on upload.
 *
 *   POST   /up?date=YYYY-MM-DD   body: the image (webp or jpeg)  -> { id, url, key }
 *   GET    /p/:id                the image, cached forever
 *   PATCH  /p/:id?date=YYYY-MM-DD  header X-Key: the event moved, so does the deletion day
 *   DELETE /p/:id                header X-Key: the key from upload
 *
 * Nothing about who uploaded or who looked is kept: no accounts, no logs
 * (observability is off in wrangler.toml). To remove a photo someone reports:
 *   npx wrangler kv key delete --binding PHOTOS <id> --remote
 */

import { cors, deleteAfter, ID_RE, json, MAX_BYTES, randomId, sha256, sniff, type Env } from './lib';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const h = cors(req, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    if (url.pathname === '/up' && req.method === 'POST') {
      if (!h['Access-Control-Allow-Origin']) return json({ error: 'origin' }, 403, h);
      const len = Number(req.headers.get('Content-Length') ?? 0);
      if (len > MAX_BYTES) return json({ error: 'too-big' }, 413, h);
      const body = new Uint8Array(await req.arrayBuffer());
      if (body.length > MAX_BYTES) return json({ error: 'too-big' }, 413, h);
      const type = sniff(body);
      if (!type) return json({ error: 'not-an-image' }, 415, h);
      const id = randomId();
      const key = randomId(24);
      const until = deleteAfter(url.searchParams.get('date'), Date.now());
      await env.PHOTOS.put(id, body, { expiration: Math.floor(until / 1000), metadata: { type, key: await sha256(key), until } });
      return json({ id, url: `${url.origin}/p/${id}`, key, until }, 201, h);
    }

    const m = /^\/p\/([^/]+)$/.exec(url.pathname);
    if (m && ID_RE.test(m[1])) {
      const id = m[1];
      if (req.method === 'GET' || req.method === 'HEAD') {
        const { value, metadata } = await env.PHOTOS.getWithMetadata(id, { type: 'arrayBuffer' });
        const left = metadata ? Math.floor((metadata.until - Date.now()) / 1000) : 0;
        if (!value || !metadata || left <= 0) return new Response('Nu mai există.', { status: 404 });
        return new Response(req.method === 'HEAD' ? null : value, {
          headers: {
            'Content-Type': metadata.type,
            // a day at most, so a photo the host deletes soon leaves the guests' phones too
            'Cache-Control': `public, max-age=${Math.min(left, 86400)}`,
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'cross-origin',
          },
        });
      }
      if (req.method === 'DELETE' || req.method === 'PATCH') {
        const { value, metadata } = await env.PHOTOS.getWithMetadata(id, { type: 'arrayBuffer' });
        const given = req.headers.get('X-Key') ?? '';
        if (!metadata || !value) return req.method === 'DELETE' ? json({ ok: true }, 200, h) : json({ error: 'gone' }, 404, h);
        if (!given || (await sha256(given)) !== metadata.key) return json({ error: 'key' }, 403, h);
        if (req.method === 'DELETE') {
          await env.PHOTOS.delete(id);
          return json({ ok: true }, 200, h);
        }
        // KV cannot change an expiry in place: write the same bytes again
        const until = deleteAfter(url.searchParams.get('date'), Date.now());
        await env.PHOTOS.put(id, new Uint8Array(value), { expiration: Math.floor(until / 1000), metadata: { ...metadata, until } });
        return json({ until }, 200, h);
      }
    }
    return new Response('INVITLITE', { status: 404 });
  },
};
