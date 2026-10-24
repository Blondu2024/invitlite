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
 *   DELETE /p/:id                header X-Key: the key from upload
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
            // browsers may keep it, but not past the day it is deleted here
            'Cache-Control': `public, max-age=${Math.min(left, 31536000)}`,
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'cross-origin',
          },
        });
      }
      if (req.method === 'DELETE') {
        const { metadata } = await env.PHOTOS.getWithMetadata(id, { type: 'arrayBuffer' });
        const given = req.headers.get('X-Key') ?? '';
        if (!metadata) return json({ ok: true }, 200, h);
        if (!given || (await sha256(given)) !== metadata.key) return json({ error: 'key' }, 403, h);
        await env.PHOTOS.delete(id);
        return json({ ok: true }, 200, h);
      }
    }
    return new Response('INVITLITE', { status: 404 });
  },
};
