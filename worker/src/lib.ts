/** Everything the photo worker uses besides its handler (the runtime wants only the handler exported from index.ts). */

/** What we keep next to each photo. */
export interface Meta {
  type: string;
  /** SHA-256 of the delete key; the key itself only ever lives in the host's browser. */
  key: string;
  until: number;
}

/** The part of Workers KV we use, so this file needs no Workers type package. */
export interface Store {
  put(key: string, value: Uint8Array, o: { expiration: number; metadata: Meta }): Promise<void>;
  getWithMetadata(key: string, o: { type: 'arrayBuffer' }): Promise<{ value: ArrayBuffer | null; metadata: Meta | null }>;
  delete(key: string): Promise<void>;
}

export interface Env {
  PHOTOS: Store;
  /** Comma-separated origins allowed to upload. */
  ORIGINS: string;
}

export const MAX_BYTES = 700 * 1024;
const DAY = 86400000;
/** How long a photo stays when the invitation has no date yet. */
export const NO_DATE_DAYS = 90;
export const ID_RE = /^[A-Za-z0-9]{16}$/;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function randomId(n = 16): string {
  let out = '';
  while (out.length < n) {
    // bytes of 248 and up are dropped, so every letter is equally likely
    for (const b of crypto.getRandomValues(new Uint8Array(n))) if (b < 248 && out.length < n) out += ALPHABET[b % 62];
  }
  return out;
}

export async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** What the bytes really are, whatever the request claims. */
export function sniff(b: Uint8Array): 'image/webp' | 'image/jpeg' | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return 'image/webp';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  return null;
}

/** 30 days after the event; 90 days from now without one; never more than two years out. */
export function deleteAfter(date: string | null, now: number): number {
  const m = date && /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const event = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
  const at = Number.isFinite(event) && event > now - 30 * DAY ? event + 30 * DAY : now + NO_DATE_DAYS * DAY;
  return Math.min(at, now + 730 * DAY);
}

export function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const ok = env.ORIGINS.split(',').map((s) => s.trim()).includes(origin);
  return ok
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, PATCH, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, X-Key', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

export const json = (body: unknown, status: number, h: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } });
