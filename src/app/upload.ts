/**
 * The host's own photo, from their phone or PC. It is shrunk here, in the
 * browser, before it goes anywhere: 1600px on the long side, webp (jpeg where
 * the browser cannot write webp). Drawing it on a canvas also leaves behind
 * the EXIF data, GPS position included. Only the result is uploaded.
 */

export const PHOTO_API: string = (import.meta.env.VITE_PHOTO_API as string | undefined)?.replace(/\/$/, '') ?? '';

const LONG_SIDE = 1600;
/** Must stay under the worker's MAX_BYTES (700 KB). */
const BUDGET = 650 * 1024;

export interface Uploaded {
  url: string;
  /** Lets this browser delete the photo before its time. */
  key: string;
  until: number;
}

/** Width and height that fit `long` on the longer side, never enlarging. */
export function fitSize(w: number, h: number, long = LONG_SIDE): [number, number] {
  const k = Math.min(1, long / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

function toBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((r) => c.toBlob(r, type, q));
}

export async function shrink(file: File): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Poza asta nu se poate citi. Încearcă una în format JPG sau PNG.');
  }
  let long = LONG_SIDE;
  for (let tries = 0; tries < 4; tries++, long = Math.round(long * 0.8)) {
    const [w, h] = fitSize(bmp.width, bmp.height, long);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    let blob = await toBlob(c, 'image/webp', 0.8);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(c, 'image/jpeg', 0.82);
    if (blob && blob.size <= BUDGET) {
      bmp.close();
      return blob;
    }
  }
  bmp.close();
  throw new Error('Poza e prea mare chiar și micșorată. Încearcă alta.');
}

export async function uploadPhoto(file: File, eventDate: string): Promise<Uploaded> {
  if (!PHOTO_API) throw new Error('Urcarea pozelor nu e pornită pe acest site.');
  const blob = await shrink(file);
  let res: Response;
  try {
    res = await fetch(`${PHOTO_API}/up?date=${encodeURIComponent(eventDate)}`, { method: 'POST', body: blob, headers: { 'Content-Type': blob.type } });
  } catch {
    throw new Error('Nu am putut urca poza. Verifică internetul și mai încearcă o dată.');
  }
  if (!res.ok) throw new Error('Serverul n-a primit poza. Mai încearcă o dată, sau alege alta.');
  const out = (await res.json()) as Uploaded;
  remember(out);
  return out;
}

const KEYS = 'invitlite.photoKeys';

function keys(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEYS) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function remember(u: Uploaded): void {
  try {
    localStorage.setItem(KEYS, JSON.stringify({ ...keys(), [u.url]: u.key }));
  } catch {
    /* private mode: the photo still expires on its own */
  }
}

/** True when this browser uploaded `url` and can delete it. */
export function canDelete(url: string): boolean {
  return !!PHOTO_API && url.startsWith(`${PHOTO_API}/p/`) && !!keys()[url];
}

export async function deletePhoto(url: string): Promise<boolean> {
  const key = keys()[url];
  if (!key) return false;
  const res = await fetch(url, { method: 'DELETE', headers: { 'X-Key': key } }).catch(() => null);
  if (!res?.ok) return false;
  const k = keys();
  delete k[url];
  try {
    localStorage.setItem(KEYS, JSON.stringify(k));
  } catch {
    /* nothing */
  }
  return true;
}
