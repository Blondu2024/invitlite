import { starter } from '../inv/defaults';
import { encodeInvitation } from '../inv/codec';
import { openHash } from '../inv/link';
import { EVENT_KINDS, type EventKind, type Invitation } from '../inv/types';

/**
 * The editor's address bar always holds the current invitation (`/creeaza/#v1...`),
 * so a bookmark or a refresh is the save button. localStorage is only a fallback
 * for someone who closes the tab and comes back to `/creeaza/` bare.
 */

const DRAFT = 'invitlite.draft';
const GUESTS = 'invitlite.guests';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the address bar still holds everything */
  }
}

/** `/creeaza/?tip=logodna` starts a fresh invitation of that kind (the landing page links there). */
export function initialInvitation(hash: string, search = ''): Invitation {
  const fromHash = openHash(hash);
  if (fromHash) return fromHash.inv;
  const tip = new URLSearchParams(search).get('tip') as EventKind | null;
  if (tip && EVENT_KINDS.includes(tip)) return starter(tip);
  const draft = read(DRAFT);
  const fromDraft = draft ? openHash(draft) : null;
  return fromDraft ? fromDraft.inv : starter('nunta');
}

export function persist(inv: Invitation): string {
  const payload = encodeInvitation(inv);
  write(DRAFT, payload);
  try {
    history.replaceState(null, '', `${location.pathname}#${payload}`);
  } catch {
    /* sandboxed: nothing to do */
  }
  return payload;
}

export function loadGuests(): string {
  return read(GUESTS) ?? '';
}

export function saveGuests(text: string): void {
  write(GUESTS, text);
}

export function guestNames(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const n = line.replace(/\s+/g, ' ').trim().slice(0, 80);
    const k = n.toLocaleLowerCase('ro');
    if (n && !seen.has(k)) {
      seen.add(k);
      out.push(n);
    }
  }
  return out.slice(0, 400);
}
