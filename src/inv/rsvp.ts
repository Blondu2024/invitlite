import { KIND_NOUN, shortDate } from './format';
import type { Invitation } from './types';

/**
 * The confirmation never touches a server: the guest's answer becomes a
 * prefilled WhatsApp message to the host. The host's phone is the database.
 */

/** Digits for wa.me, in international form. Romanian 07xx numbers get the 40 prefix. */
export function waNumber(phone: string): string {
  let d = phone.trim();
  const plus = d.startsWith('+');
  d = d.replace(/\D/g, '');
  if (plus) return d.length >= 8 ? d : '';
  if (d.startsWith('00')) d = d.slice(2);
  else if (/^07\d{8}$/.test(d)) d = '4' + d;
  return d.length >= 8 && d.length <= 15 ? d : '';
}

export interface RsvpAnswer {
  name: string;
  coming: boolean;
  adults: number;
  kids: number;
  veg: number;
  message: string;
}

function clampCount(n: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0;
}

export function rsvpText(inv: Invitation, a: RsvpAnswer): string {
  const event = [KIND_NOUN[inv.kind], inv.hosts].filter(Boolean).join(' ');
  const when = shortDate(inv.date);
  const lines = [`Confirmare pentru ${event}${when ? ` (${when})` : ''}`];
  lines.push(`Nume: ${a.name.trim() || '-'}`);
  if (!a.coming) {
    lines.push('Răspuns: NU putem veni');
  } else {
    const adults = clampCount(a.adults, 20) || 1;
    const kids = inv.askKids ? clampCount(a.kids, 20) : 0;
    const who = [`${adults} ${adults === 1 ? 'adult' : 'adulți'}`];
    if (kids) who.push(`${kids} ${kids === 1 ? 'copil' : 'copii'}`);
    lines.push('Răspuns: DA, venim');
    lines.push(`Persoane: ${who.join(', ')}`);
    if (inv.askMenu) {
      const veg = Math.min(clampCount(a.veg, 20), adults + kids);
      lines.push(`Meniu vegetarian: ${veg}`);
    }
  }
  const msg = a.message.trim().slice(0, 500);
  if (msg) lines.push(`Mesaj: ${msg}`);
  return lines.join('\n');
}

/** wa.me link to the host, or '' when the host left no usable number. */
export function rsvpUrl(inv: Invitation, a: RsvpAnswer): string {
  const n = waNumber(inv.rsvpPhone);
  if (!n) return '';
  return `https://wa.me/${n}?text=${encodeURIComponent(rsvpText(inv, a))}`;
}

/** wa.me share link with no recipient: WhatsApp asks which chat to send it to. */
export function waShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
