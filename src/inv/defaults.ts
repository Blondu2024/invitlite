import { KINDS } from './kinds';
import type { EventKind, Invitation, Moment } from './types';

/** Starter text per event, so nobody faces an empty form. Everything is editable. */

const m = (title: string, time: string, place = '', address = ''): Moment => ({
  title,
  time,
  place,
  address,
  mapUrl: '',
});

export const STARTERS = Object.fromEntries(
  Object.entries(KINDS).map(([k, d]) => [
    k,
    { intro: d.intro, message: d.message, moments: d.moments.map(([t, h]) => m(t, h)), askKids: d.askKids, askMenu: d.askMenu, music: d.music },
  ]),
) as Record<EventKind, Pick<Invitation, 'intro' | 'message' | 'moments' | 'askKids' | 'askMenu' | 'music'>>;

export function starter(kind: EventKind, prev?: Invitation): Invitation {
  const s = STARTERS[kind];
  return {
    v: 1,
    kind,
    template: prev?.template ?? 'clasic',
    hosts: prev?.hosts ?? '',
    date: prev?.date ?? '',
    city: prev?.city ?? '',
    photo: prev?.photo ?? '',
    intro: s.intro,
    message: s.message,
    parents: prev?.parents ?? '',
    godparents: prev?.godparents ?? '',
    moments: s.moments.map((x) => ({ ...x })),
    rsvpPhone: prev?.rsvpPhone ?? '',
    rsvpBy: prev?.rsvpBy ?? '',
    askKids: s.askKids,
    askMenu: s.askMenu,
    music: s.music,
    note: prev?.note ?? '',
    title: prev?.title ?? '',
    snacks: prev?.snacks ?? '',
  };
}

/** The example shown on the landing page and behind "vezi un exemplu". Fictional people. */
export const SAMPLE: Invitation = {
  v: 1,
  kind: 'nunta',
  template: 'clasic',
  hosts: 'Ana & Mihai',
  date: '2027-06-12',
  city: 'Galați',
  photo: '',
  intro: STARTERS.nunta.intro,
  message: STARTERS.nunta.message,
  parents: 'Elena și Gheorghe Popa\nMaria și Ion Stan',
  godparents: 'Ioana și Andrei Munteanu',
  moments: [
    m('Cununia religioasă', '15:00', 'Biserica Sf. Nicolae', 'Strada Domnească, Galați'),
    m('Petrecerea', '19:00', 'Restaurantul de la malul Dunării', 'Faleza Dunării, Galați'),
  ],
  rsvpPhone: '0700 000 000',
  rsvpBy: '2027-05-15',
  askKids: true,
  askMenu: true,
  note: 'Ținuta: elegantă. Copiii sunt bineveniți, avem și un colț de joacă pentru ei.',
  title: '',
  snacks: '',
  music: 'vals',
};

/** One example per kind, for the landing page and the phone-check links. Fictional people. */
export function sampleFor(kind: EventKind): Invitation {
  if (kind === 'nunta') return SAMPLE;
  if (kind === 'film') return SAMPLE_FILM;
  const d = KINDS[kind];
  return {
    ...SAMPLE,
    kind,
    template: d.template,
    hosts: d.sample ?? d.hint,
    intro: d.intro,
    message: d.message,
    music: d.music,
    askKids: d.askKids,
    askMenu: d.askMenu,
    parents: d.family ? SAMPLE.parents : '',
    godparents: d.family ? SAMPLE.godparents : '',
    moments: d.places.map(([place, address], i) => m(d.moments[i]?.[0] ?? d.moments[0][0], d.moments[i]?.[1] ?? '', place, address)),
    note: '',
  };
}

/** The film-night example. Fictional people, an invented title. */
export const SAMPLE_FILM: Invitation = {
  ...SAMPLE,
  kind: 'film',
  template: 'seara',
  hosts: 'Ioana și Radu',
  date: '2027-01-15',
  intro: STARTERS.film.intro,
  message: '',
  parents: '',
  godparents: '',
  moments: [m('Începe filmul', '20:00', 'Sufrageria noastră', 'Strada Brăilei 12, Galați')],
  rsvpBy: '',
  askKids: false,
  askMenu: false,
  note: 'Aduceți-vă papucii. Pături avem.',
  title: 'Maraton de comedii vechi',
  snacks: 'Popcorn cu unt, pizza făcută în casă și limonadă.',
  music: 'jazz',
};
