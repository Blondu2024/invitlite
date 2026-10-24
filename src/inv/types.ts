export type EventKind =
  | 'nunta' | 'cununie' | 'logodna' | 'casatorie' | 'burlaci' | 'burlacite'
  | 'botez' | 'copii' | 'mot' | 'bebe' | 'genul'
  | 'aniversare' | 'majorat' | 'onomastica'
  | 'craciun' | 'paste' | 'revelion' | 'casa' | 'gratar' | 'film'
  | 'absolvire' | 'banchet' | 'promotie' | 'pensie' | 'deschidere';
export type TemplateId = 'clasic' | 'botanic' | 'seara';

/** In category order (see kinds.ts). The id travels in the link, so it never changes. */
export const EVENT_KINDS: EventKind[] = [
  'nunta', 'cununie', 'logodna', 'casatorie', 'burlaci', 'burlacite',
  'botez', 'copii', 'mot', 'bebe', 'genul',
  'aniversare', 'majorat', 'onomastica',
  'craciun', 'paste', 'revelion', 'casa', 'gratar', 'film',
  'absolvire', 'banchet', 'promotie', 'pensie', 'deschidere',
];
export const TEMPLATE_IDS: TemplateId[] = ['clasic', 'botanic', 'seara'];

/** Background tunes, composed for this project and played by the browser itself. */
export type MusicId = 'vals' | 'cutie' | 'pian' | 'petrecere' | 'jazz';
export const MUSIC_IDS: MusicId[] = ['vals', 'cutie', 'pian', 'petrecere', 'jazz'];

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
  /** https link to a photo hosted elsewhere. Only the address rides in the link. */
  photo: string;
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
  /** Film night: what is showing ("Maraton de comedii"). Empty for the other kinds. */
  title: string;
  /** Film night: what is on the snack table. */
  snacks: string;
  /** Background music, '' for none. Starts only when the guest opens the invitation. */
  music: MusicId | '';
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
  photo: 600,
  moments: 6,
  phone: 24,
  guest: 80,
  title: 80,
  snacks: 200,
} as const;
