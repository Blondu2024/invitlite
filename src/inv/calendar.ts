import { KIND_LABEL } from './format';
import type { Invitation } from './types';

/**
 * Times are "floating" (no time zone): a wedding at 16:00 in Galați is at 16:00
 * on the guest's calendar too, wherever the phone thinks it is.
 */

interface Span {
  start: string;
  end: string;
  allDay: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function stamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
}

export function eventSpan(inv: Invitation): Span | null {
  if (!inv.date) return null;
  const [y, m, d] = inv.date.split('-').map(Number);
  const times = inv.moments.map((x) => x.time).filter(Boolean);
  if (!times.length) {
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    const ymd = (x: Date) => `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}`;
    return { start: ymd(new Date(Date.UTC(y, m - 1, d))), end: ymd(next), allDay: true };
  }
  const toDate = (t: string) => {
    const [h, min] = t.split(':').map(Number);
    return new Date(Date.UTC(y, m - 1, d, h, min));
  };
  const first = toDate(times[0]);
  // Moments are entered in order; a later one with an earlier clock time means past midnight.
  let last = toDate(times[times.length - 1]);
  if (last < first) last = new Date(last.getTime() + 86400000);
  const end = new Date(last.getTime() + (times.length > 1 ? 5 : 3) * 3600000);
  return { start: stamp(first), end: stamp(end), allDay: false };
}

export function eventTitle(inv: Invitation): string {
  return [KIND_LABEL[inv.kind], inv.hosts].filter(Boolean).join(' ');
}

function location(inv: Invitation): string {
  const m = inv.moments[0];
  return m ? [m.place, m.address].filter(Boolean).join(', ') : inv.city;
}

export function googleCalendarUrl(inv: Invitation, link: string): string {
  const s = eventSpan(inv);
  if (!s) return '';
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(inv),
    dates: `${s.start}/${s.end}`,
    details: `Invitația: ${link}`,
    location: location(inv),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export function icsFile(inv: Invitation, link: string, now = new Date()): string {
  const s = eventSpan(inv);
  if (!s) return '';
  const val = (x: string) => (s.allDay ? `;VALUE=DATE:${x}` : `:${x}`);
  const uid = `${s.start}-${Math.abs(hash(eventTitle(inv)))}@invitlite`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INVITLITE//RO',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(now)}Z`,
    `DTSTART${val(s.start)}`,
    `DTEND${val(s.end)}`,
    `SUMMARY:${icsEscape(eventTitle(inv))}`,
    `LOCATION:${icsEscape(location(inv))}`,
    `DESCRIPTION:${icsEscape('Invitația: ' + link)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n') + '\r\n';
}

/** RFC 5545: content lines longer than 75 octets continue on a line starting with a space. */
export function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    const limit = out.length ? 74 : 75;
    if (bytes + b > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
