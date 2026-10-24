import { safePhotoUrl } from './sanitize';
import { EVENT_KINDS, LIMITS, TEMPLATE_IDS, type Invitation, type Moment } from './types';

/**
 * A decoded link is untrusted JSON. Whatever shape arrives, what leaves here is
 * a complete Invitation with every string clamped and every enum valid.
 */

function str(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/\r\n?/g, '\n').slice(0, max).trim();
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export function isoDate(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? v : '';
}

export function hhmm(v: unknown): string {
  if (typeof v !== 'string') return '';
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return '';
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? `${String(h).padStart(2, '0')}:${m[2]}` : '';
}

function moment(v: unknown): Moment | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const m: Moment = {
    title: str(o.title, LIMITS.momentTitle),
    time: hhmm(o.time),
    place: str(o.place, LIMITS.place),
    address: str(o.address, LIMITS.address),
    mapUrl: str(o.mapUrl, LIMITS.mapUrl),
  };
  return m.title || m.place || m.address ? m : null;
}

export function normalizeInvitation(raw: unknown): Invitation {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const moments = Array.isArray(o.moments)
    ? o.moments.map(moment).filter((m): m is Moment => m !== null).slice(0, LIMITS.moments)
    : [];
  return {
    v: 1,
    kind: oneOf(o.kind, EVENT_KINDS, 'nunta'),
    template: oneOf(o.template, TEMPLATE_IDS, 'clasic'),
    hosts: str(o.hosts, LIMITS.hosts),
    date: isoDate(o.date),
    city: str(o.city, LIMITS.city),
    photo: safePhotoUrl(str(o.photo, LIMITS.photo)),
    intro: str(o.intro, LIMITS.intro),
    message: str(o.message, LIMITS.message),
    parents: str(o.parents, LIMITS.parents),
    godparents: str(o.godparents, LIMITS.godparents),
    moments,
    rsvpPhone: str(o.rsvpPhone, LIMITS.phone),
    rsvpBy: isoDate(o.rsvpBy),
    askKids: o.askKids === true,
    askMenu: o.askMenu === true,
    note: str(o.note, LIMITS.note),
    title: str(o.title, LIMITS.title),
    snacks: str(o.snacks, LIMITS.snacks),
  };
}
