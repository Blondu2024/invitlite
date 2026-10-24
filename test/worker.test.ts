import { describe, expect, it } from 'vitest';
import worker from '../worker/src/index';
import { deleteAfter, MAX_BYTES, NO_DATE_DAYS, randomId, sniff, type Env, type Meta, type Store } from '../worker/src/lib';
import { fitSize } from '../src/app/upload';

/** Workers KV, in a Map (expiry is KV's job, so only recorded here). */
function fakeStore() {
  const m = new Map<string, { value: Uint8Array; metadata: Meta; expiration: number }>();
  const b: Store = {
    async put(key, value, o) {
      m.set(key, { value, metadata: o.metadata, expiration: o.expiration });
    },
    async getWithMetadata(key) {
      const v = m.get(key);
      return v ? { value: v.value.slice().buffer, metadata: v.metadata } : { value: null, metadata: null };
    },
    async delete(key) {
      m.delete(key);
    },
  };
  return { b, m };
}

const ORIGIN = 'https://invitlite-preview.vercel.app';
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38]);

function setup() {
  const { b, m } = fakeStore();
  const env: Env = { PHOTOS: b, ORIGINS: `${ORIGIN},http://localhost:5173` };
  const call = (path: string, init: RequestInit = {}, origin = ORIGIN) =>
    worker.fetch(new Request(`https://ph.example${path}`, { ...init, headers: { Origin: origin, ...(init.headers as Record<string, string>) } }), env);
  return { env, m, call };
}

describe('photo worker', () => {
  it('stores an image and serves it back, with a short address', async () => {
    const { call, m } = setup();
    const r = await call('/up?date=2027-06-12', { method: 'POST', body: WEBP });
    expect(r.status).toBe(201);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    const out = (await r.json()) as { id: string; url: string; key: string; until: number };
    expect(out.url).toBe(`https://ph.example/p/${out.id}`);
    expect(out.url.length).toBeLessThan(60);
    expect(m.get(out.id)!.metadata.key).not.toBe(out.key); // only the hash is kept
    expect(m.get(out.id)!.expiration).toBe(Math.floor(out.until / 1000));
    const g = await call(`/p/${out.id}`);
    expect(g.status).toBe(200);
    expect(g.headers.get('Content-Type')).toBe('image/webp');
    expect(new Uint8Array(await g.arrayBuffer())).toEqual(WEBP);
  });

  it('refuses what is not a photo, what is too big, and strangers', async () => {
    const { call } = setup();
    expect((await call('/up', { method: 'POST', body: new TextEncoder().encode('<script>alert(1)</script>') })).status).toBe(415);
    const big = new Uint8Array(MAX_BYTES + 1);
    big.set(WEBP);
    expect((await call('/up', { method: 'POST', body: big })).status).toBe(413);
    expect((await call('/up', { method: 'POST', body: WEBP }, 'https://evil.example')).status).toBe(403);
    expect((await call('/p/../../etc')).status).toBe(404);
  });

  it('deletes only with the key from upload', async () => {
    const { call, m } = setup();
    const { id, key } = (await (await call('/up', { method: 'POST', body: WEBP })).json()) as { id: string; key: string };
    expect((await call(`/p/${id}`, { method: 'DELETE', headers: { 'X-Key': 'wrong' } })).status).toBe(403);
    expect(m.has(id)).toBe(true);
    expect((await call(`/p/${id}`, { method: 'DELETE', headers: { 'X-Key': key } })).status).toBe(200);
    expect(m.has(id)).toBe(false);
    expect((await call(`/p/${id}`)).status).toBe(404);
  });

  it('keeps a photo until 30 days after the event, then it is gone', async () => {
    const now = Date.UTC(2027, 0, 1);
    expect(deleteAfter('2027-06-12', now)).toBe(Date.UTC(2027, 6, 12));
    expect(deleteAfter('', now)).toBe(now + 90 * 86400000);
    expect(deleteAfter('2015-01-01', now)).toBe(now + 90 * 86400000); // a past date is a typo
    expect(deleteAfter('2099-01-01', now)).toBe(now + 730 * 86400000);

    // even if KV is slow to drop it, a photo past its day is never served
    const { call, m } = setup();
    const { id } = (await (await call('/up', { method: 'POST', body: WEBP })).json()) as { id: string };
    const r = await call(`/p/${id}`);
    expect(Number(/max-age=(\d+)/.exec(r.headers.get('Cache-Control')!)![1])).toBeLessThanOrEqual(86400); // a deleted photo leaves guests' phones within a day
    m.get(id)!.metadata.until = Date.now() - 1;
    expect((await call(`/p/${id}`)).status).toBe(404);
  });

  it('moves the deletion day when the event moves, only with the key', async () => {
    const { call, m } = setup();
    const { id, key, until } = (await (await call('/up', { method: 'POST', body: WEBP })).json()) as { id: string; key: string; until: number };
    expect(until).toBeGreaterThan(Date.now() + (NO_DATE_DAYS - 1) * 86400000);
    expect((await call(`/p/${id}?date=2027-06-12`, { method: 'PATCH', headers: { 'X-Key': 'nope' } })).status).toBe(403);
    const r = await call(`/p/${id}?date=2027-06-12`, { method: 'PATCH', headers: { 'X-Key': key } });
    expect(r.status).toBe(200);
    const moved = Date.UTC(2027, 6, 12);
    expect(((await r.json()) as { until: number }).until).toBe(moved);
    expect(m.get(id)!.metadata.until).toBe(moved);
    expect(m.get(id)!.expiration).toBe(moved / 1000);
    expect(m.get(id)!.value).toEqual(WEBP); // same photo, rewritten
    expect((await call('/p/AAAAAAAAAAAAAAAA?date=2027-06-12', { method: 'PATCH', headers: { 'X-Key': key } })).status).toBe(404);
  });

  it('knows images by their bytes', () => {
    expect(sniff(WEBP)).toBe('image/webp');
    expect(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  });

  it('ids are long and unguessable', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => randomId()));
    expect(ids.size).toBe(2000);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9]{16}$/);
  });
});

describe('shrinking in the browser', () => {
  it('fits the long side, never enlarges', () => {
    expect(fitSize(4000, 3000)).toEqual([1600, 1200]);
    expect(fitSize(3000, 4000)).toEqual([1200, 1600]);
    expect(fitSize(800, 600)).toEqual([800, 600]);
  });
});

describe('the privacy page', () => {
  it('exists, says what the code does, and is linked from every invitation', async () => {
    const { readFileSync } = await import('node:fs');
    const html = readFileSync('confidentialitate/index.html', 'utf8');
    expect(html).toContain('30 de zile după');
    expect(html).toContain(`${NO_DATE_DAYS} de zile`);
    expect(html).toContain('id="raporteaza"');
    expect(html).toContain('ELI-SAMI-TECH');
    expect(html).not.toMatch(/—|—/);
    const { renderBody } = await import('../src/inv/render');
    const { SAMPLE } = await import('../src/inv/defaults');
    const inv = renderBody(SAMPLE, { base: 'https://invitlite.app', guest: '', envelope: true, today: new Date(2027, 0, 1) });
    expect(inv).toContain('https://invitlite.app/confidentialitate/#raporteaza');
  });
});
