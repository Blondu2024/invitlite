import type { EventKind, Invitation, Moment } from './types';

/** Starter text per event, so nobody faces an empty form. Everything is editable. */

const m = (title: string, time: string, place = '', address = ''): Moment => ({
  title,
  time,
  place,
  address,
  mapUrl: '',
});

export const STARTERS: Record<EventKind, Pick<Invitation, 'intro' | 'message' | 'moments' | 'askKids' | 'askMenu'>> = {
  nunta: {
    intro: 'Cu bucurie în suflet, vă invităm să fiți alături de noi în ziua în care ne unim destinele.',
    message: 'Dragostea nu constă în a ne privi unul pe altul, ci în a privi împreună în aceeași direcție.',
    moments: [m('Cununia religioasă', '15:00'), m('Petrecerea', '19:00')],
    askKids: true,
    askMenu: true,
  },
  botez: {
    intro: 'Pentru că cele mai frumoase momente se trăiesc alături de cei dragi, vă invităm la botezul nostru.',
    message: 'Am venit pe lume de curând și vreau să vă cunosc pe toți.',
    moments: [m('Taina Sfântului Botez', '12:00'), m('Masa festivă', '14:00')],
    askKids: true,
    askMenu: false,
  },
  cununie: {
    intro: 'Ne spunem „da" în fața ofițerului de stare civilă și vrem să fiți acolo.',
    message: '',
    moments: [m('Cununia civilă', '13:00'), m('Masa în familie', '15:00')],
    askKids: false,
    askMenu: false,
  },
  aniversare: {
    intro: 'Facem o petrecere și locul tău e la masa noastră.',
    message: '',
    moments: [m('Petrecerea', '19:00')],
    askKids: false,
    askMenu: false,
  },
};

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
    note: prev?.note ?? '',
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
};
