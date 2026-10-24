// Prints sample invitation links for checking the entrance scenes on a phone.
import { SAMPLE, SAMPLE_FILM } from '../src/inv/defaults';
import { invitationUrl } from '../src/inv/link';

const origin = process.argv[2] || 'https://invitlite-preview.vercel.app';
for (const t of ['clasic', 'botanic', 'seara'] as const) {
  console.log(`nunta ${t}: ${invitationUrl(origin, { ...SAMPLE, template: t }, 'Familia Popescu')}`);
}
for (const t of ['seara', 'clasic', 'botanic'] as const) {
  console.log(`film ${t}: ${invitationUrl(origin, { ...SAMPLE_FILM, template: t }, 'Familia Popescu')}`);
}
