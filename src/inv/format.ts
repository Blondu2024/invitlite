import type { EventKind } from './types';

/** Romanian dates and plurals, by hand: Intl output varies between engines. */

const MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];
const WEEKDAYS = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];

function parts(iso: string): { y: number; m: number; d: number; wd: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return { y, m: mo, d, wd };
}

/** "sâmbătă, 12 iunie 2027" */
export function longDate(iso: string): string {
  const p = parts(iso);
  if (!p) return '';
  return `${WEEKDAYS[p.wd]}, ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "12 iunie 2027" */
export function shortDate(iso: string): string {
  const p = parts(iso);
  if (!p) return '';
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "12.06.2027", the way the date is written on paper invitations. */
export function dottedDate(iso: string): string {
  const p = parts(iso);
  if (!p) return '';
  return `${String(p.d).padStart(2, '0')}.${String(p.m).padStart(2, '0')}.${p.y}`;
}

/** Romanian count phrase: 1 zi, 5 zile, 20 de zile, 101 zile. */
export function roCount(n: number, one: string, few: string): string {
  if (n === 1) return `1 ${one}`;
  const r = n % 100;
  const de = n !== 0 && (r === 0 || r >= 20);
  return `${n} ${de ? 'de ' : ''}${few}`;
}

/** Whole days from `today` (local midnight) to the event date. Negative once it has passed. */
export function daysUntil(iso: string, today: Date): number | null {
  const p = parts(iso);
  if (!p) return null;
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(p.y, p.m - 1, p.d);
  return Math.round((b - a) / 86400000);
}

export const KIND_LABEL: Record<EventKind, string> = {
  nunta: 'Nunta',
  botez: 'Botezul',
  cununie: 'Cununia civilă',
  aniversare: 'Aniversarea',
  copii: 'Petrecere de copii',
  film: 'Seara de film',
};

/** Lower-case form for running text: "confirmare pentru nunta lui ...". */
export const KIND_NOUN: Record<EventKind, string> = {
  nunta: 'nunta',
  botez: 'botezul',
  cununie: 'cununia civilă',
  aniversare: 'aniversarea',
  copii: 'petrecerea',
  film: 'seara de film',
};

/** Small stable hash, so the same guest always gets the same seat. */
export function hashName(s: string): number {
  let h = 2166136261;
  for (const ch of s.trim().toLocaleLowerCase('ro')) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A playful cinema seat for a film-night ticket: "Rândul F, locul 7". */
export function seatFor(guest: string): { row: string; seat: number; no: string } {
  if (!guest.trim()) return { row: '', seat: 0, no: '0001' };
  const h = hashName(guest);
  return {
    row: 'ABCDEFGHJKL'[h % 11],
    seat: 1 + ((h >>> 8) % 18),
    no: String(1 + ((h >>> 16) % 9999)).padStart(4, '0'),
  };
}

export function initials(hosts: string): string {
  const words = hosts
    .split(/[\s&+,]+/)
    .filter((w) => /^\p{L}/u.test(w) && !/^(și|si|and)$/i.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase('ro'))
    .join('');
}
