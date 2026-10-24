// Prints sample invitation links for checking the entrance scenes on a phone.
import { SAMPLE, SAMPLE_FILM, STARTERS } from '../src/inv/defaults';
import { invitationUrl } from '../src/inv/link';
import type { Invitation } from '../src/inv/types';

const origin = process.argv[2] || 'https://invitlite-preview.vercel.app';
const guest = 'Familia Popescu';
const of = (kind: Invitation['kind'], extra: Partial<Invitation>): Invitation => ({
  ...SAMPLE,
  kind,
  intro: STARTERS[kind].intro,
  message: STARTERS[kind].message,
  ...extra,
});

const samples: [string, Invitation][] = [
  ['nunta', SAMPLE],
  ['botez', of('botez', { hosts: 'Sofia Maria', template: 'botanic' })],
  ['cununie', of('cununie', { hosts: 'Ana & Mihai', template: 'clasic', parents: '', godparents: '' })],
  ['aniversare', of('aniversare', { hosts: 'Bunicul Ion, 70 de ani', template: 'seara', parents: '', godparents: '' })],
  [
    'copii',
    of('copii', {
      hosts: 'Matei, 4 ani',
      template: 'clasic',
      parents: '',
      godparents: '',
      moments: [{ title: 'Petrecerea', time: '16:00', place: 'Locul de joacă Arca', address: 'Galați', mapUrl: '' }],
    }),
  ],
  ['film', SAMPLE_FILM],
];
for (const [name, inv] of samples) console.log(`${name}: ${invitationUrl(origin, inv, guest)}`);
