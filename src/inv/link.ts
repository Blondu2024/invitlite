import { decodeInvitation, encodeInvitation } from './codec';
import { normalizeInvitation } from './normalize';
import { LIMITS, type Invitation } from './types';

/**
 * A guest's personal link is the invitation link plus `~<guest name>`.
 * `~` is outside the base64url alphabet, so it can never collide with the payload.
 */

const SEP = '~';

export function invitationHash(inv: Invitation, guest = ''): string {
  const g = guest.trim().slice(0, LIMITS.guest);
  return encodeInvitation(inv) + (g ? SEP + encodeURIComponent(g) : '');
}

export function invitationUrl(origin: string, inv: Invitation, guest = ''): string {
  return `${origin}/i/#${invitationHash(inv, guest)}`;
}

export interface Opened {
  inv: Invitation;
  guest: string;
}

export function openHash(hash: string): Opened | null {
  const t = hash.trim().replace(/^#/, '');
  const at = t.indexOf(SEP);
  const payload = at === -1 ? t : t.slice(0, at);
  const raw = decodeInvitation(payload);
  if (raw === null) return null;
  let guest = '';
  if (at !== -1) {
    try {
      guest = decodeURIComponent(t.slice(at + 1));
    } catch {
      guest = '';
    }
  }
  guest = guest.replace(/\s+/g, ' ').trim().slice(0, LIMITS.guest);
  return { inv: normalizeInvitation(raw), guest };
}
