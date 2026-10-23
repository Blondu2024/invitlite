export type EventKind = 'nunta' | 'botez' | 'cununie' | 'aniversare';
export type TemplateId = 'clasic' | 'botanic' | 'seara';

export const EVENT_KINDS: EventKind[] = ['nunta', 'botez', 'cununie', 'aniversare'];
export const TEMPLATE_IDS: TemplateId[] = ['clasic', 'botanic', 'seara'];

/** One stop of the day: the church, the town hall, the restaurant. */
export interface Moment {
  title: string;
  /** HH:MM, 24h. Empty when the host did not set one. */
  time: string;
  place: string;
  address: string;
  /** Optional link the host pasted (Google Maps / Waze). Built from the address otherwise. */
  mapUrl: string;
}

/** Everything the invitation is. It all travels inside the link. */
export interface Invitation {
  v: 1;
  kind: EventKind;
  template: TemplateId;
  /** "Ana & Mihai", "Sofia", "Bunicul Ion". */
  hosts: string;
  /** YYYY-MM-DD. */
  date: string;
  city: string;
  intro: string;
  message: string;
  parents: string;
  godparents: string;
  moments: Moment[];
  /** Number the RSVP lands on, as WhatsApp. */
  rsvpPhone: string;
  /** YYYY-MM-DD, optional. */
  rsvpBy: string;
  askKids: boolean;
  askMenu: boolean;
  note: string;
}

export const LIMITS = {
  hosts: 80,
  city: 60,
  intro: 240,
  message: 600,
  parents: 200,
  godparents: 200,
  note: 400,
  momentTitle: 60,
  place: 80,
  address: 160,
  mapUrl: 600,
  moments: 6,
  phone: 24,
  guest: 80,
} as const;
