// Prints sample invitation links for checking the entrance scenes on a phone.
import { sampleFor } from '../src/inv/defaults';
import { invitationUrl } from '../src/inv/link';
import { EVENT_KINDS } from '../src/inv/types';

const origin = process.argv[2] || 'https://invitlite-preview.vercel.app';
for (const k of EVENT_KINDS) console.log(`${k}: ${invitationUrl(origin, sampleFor(k), 'Familia Popescu')}`);
