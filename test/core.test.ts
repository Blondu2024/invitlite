import { describe, expect, it } from 'vitest';
import { decodeInvitation, encodeInvitation } from '../src/inv/codec';
import { normalizeInvitation, hhmm, isoDate } from '../src/inv/normalize';
import { daysUntil, initials, longDate, roCount } from '../src/inv/format';
import { invitationHash, openHash } from '../src/inv/link';
import { rsvpText, rsvpUrl, waNumber } from '../src/inv/rsvp';
import { eventSpan, fold, googleCalendarUrl, icsFile } from '../src/inv/calendar';
import { SAMPLE, starter } from '../src/inv/defaults';
import { EVENT_KINDS } from '../src/inv/types';

describe('codec + link', () => {
  it('round-trips the sample byte for byte', () => {
    expect(decodeInvitation(encodeInvitation(SAMPLE))).toEqual(SAMPLE);
  });

  it('keeps a guest name with diacritics and spaces', () => {
    const o = openHash('#' + invitationHash(SAMPLE, 'Familia Ștefănescu'));
    expect(o?.guest).toBe('Familia Ștefănescu');
    expect(o?.inv).toEqual(SAMPLE);
  });

  it('a link without a guest opens with an empty guest', () => {
    expect(openHash(invitationHash(SAMPLE))?.guest).toBe('');
  });

  it('survives a broken guest suffix', () => {
    const o = openHash(invitationHash(SAMPLE) + '~%E0%A4%A');
    expect(o?.inv).toEqual(SAMPLE);
    expect(o?.guest).toBe('');
  });

  it('rejects foreign payloads', () => {
    expect(openHash('#hello')).toBeNull();
    expect(openHash('#v1.@@@')).toBeNull();
  });

  it('the sample link stays small enough to share and to fit a QR', () => {
    expect(invitationHash(SAMPLE).length).toBeLessThan(1400);
  });
});

describe('normalize', () => {
  it('turns garbage into a complete invitation', () => {
    const n = normalizeInvitation({ kind: 'evil', template: 1, hosts: 42, moments: 'x' });
    expect(n.kind).toBe('nunta');
    expect(n.template).toBe('clasic');
    expect(n.hosts).toBe('');
    expect(n.moments).toEqual([]);
  });

  it('clamps long strings and caps moments', () => {
    const n = normalizeInvitation({
      hosts: 'a'.repeat(500),
      moments: Array.from({ length: 20 }, () => ({ title: 'x' })),
    });
    expect(n.hosts.length).toBe(80);
    expect(n.moments.length).toBe(6);
  });

  it('validates dates and times', () => {
    expect(isoDate('2027-02-30')).toBe('');
    expect(isoDate('2028-02-29')).toBe('2028-02-29');
    expect(hhmm('9:05')).toBe('09:05');
    expect(hhmm('24:00')).toBe('');
  });

  it('booleans only from real booleans', () => {
    expect(normalizeInvitation({ askKids: 'true' }).askKids).toBe(false);
  });
});

describe('format', () => {
  it('writes Romanian dates', () => {
    expect(longDate('2027-06-12')).toBe('sâmbătă, 12 iunie 2027');
  });

  it('counts the Romanian way', () => {
    expect(roCount(1, 'zi', 'zile')).toBe('1 zi');
    expect(roCount(7, 'zi', 'zile')).toBe('7 zile');
    expect(roCount(19, 'zi', 'zile')).toBe('19 zile');
    expect(roCount(20, 'zi', 'zile')).toBe('20 de zile');
    expect(roCount(101, 'zi', 'zile')).toBe('101 zile');
    expect(roCount(120, 'zi', 'zile')).toBe('120 de zile');
    expect(roCount(200, 'zi', 'zile')).toBe('200 de zile');
  });

  it('counts days to the event', () => {
    expect(daysUntil('2027-06-12', new Date(2027, 5, 10, 23, 30))).toBe(2);
    expect(daysUntil('2027-06-12', new Date(2027, 5, 12, 8))).toBe(0);
  });

  it('builds monograms', () => {
    expect(initials('Ana & Mihai')).toBe('AM');
    expect(initials('Ana și Mihai')).toBe('AM');
    expect(initials('ștefan')).toBe('Ș');
    expect(initials('')).toBe('');
  });
});

describe('rsvp', () => {
  it('normalizes phone numbers for wa.me', () => {
    expect(waNumber('0722 123 456')).toBe('40722123456');
    expect(waNumber('+45 12 34 56 78')).toBe('4512345678');
    expect(waNumber('0045 12345678')).toBe('4512345678');
    expect(waNumber('123')).toBe('');
  });

  const yes = { name: 'Familia Popescu', coming: true, adults: 2, kids: 1, veg: 1, message: 'Abia așteptăm!' };

  it('writes a readable yes', () => {
    const t = rsvpText(SAMPLE, yes);
    expect(t).toContain('Confirmare pentru nunta Ana & Mihai (12 iunie 2027)');
    expect(t).toContain('Răspuns: DA, venim');
    expect(t).toContain('Persoane: 2 adulți, 1 copil');
    expect(t).toContain('Meniu vegetarian: 1');
    expect(t).toContain('Mesaj: Abia așteptăm!');
  });

  it('a no carries no head count', () => {
    const t = rsvpText(SAMPLE, { ...yes, coming: false });
    expect(t).toContain('NU putem veni');
    expect(t).not.toContain('Persoane');
  });

  it('omits questions the host did not ask', () => {
    const t = rsvpText({ ...SAMPLE, askKids: false, askMenu: false }, yes);
    expect(t).toContain('Persoane: 2 adulți');
    expect(t).not.toContain('copil');
    expect(t).not.toContain('vegetarian');
  });

  it('vegetarian count never exceeds the party', () => {
    expect(rsvpText(SAMPLE, { ...yes, adults: 1, kids: 0, veg: 9 })).toContain('Meniu vegetarian: 1');
  });

  it('points wa.me at the host', () => {
    expect(rsvpUrl(SAMPLE, yes)).toMatch(/^https:\/\/wa\.me\/40700000000\?text=Confirmare/);
    expect(rsvpUrl({ ...SAMPLE, rsvpPhone: '' }, yes)).toBe('');
  });
});

describe('calendar', () => {
  it('spans from the first moment to after the last', () => {
    expect(eventSpan(SAMPLE)).toEqual({ start: '20270612T150000', end: '20270613T000000', allDay: false });
  });

  it('a party past midnight rolls to the next day', () => {
    const inv = { ...SAMPLE, moments: [SAMPLE.moments[0], { ...SAMPLE.moments[1], time: '01:00' }] };
    expect(eventSpan(inv)?.end).toBe('20270613T060000');
  });

  it('no times means an all-day event', () => {
    const inv = { ...SAMPLE, moments: [] };
    expect(eventSpan(inv)).toEqual({ start: '20270612', end: '20270613', allDay: true });
    expect(icsFile(inv, 'x')).toContain('DTSTART;VALUE=DATE:20270612');
  });

  it('builds a Google Calendar link', () => {
    const u = new URL(googleCalendarUrl(SAMPLE, 'https://x/i/#v1.a'));
    expect(u.searchParams.get('dates')).toBe('20270612T150000/20270613T000000');
    expect(u.searchParams.get('text')).toBe('Nunta Ana & Mihai');
  });

  it('folds ics lines at 75 octets, diacritics included', () => {
    const ics = icsFile(SAMPLE, 'https://invitlite.app/i/#' + 'v1.' + 'a'.repeat(2000));
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(fold('ș'.repeat(60)).split('\r\n ').join('')).toBe('ș'.repeat(60));
  });
});

describe('starters', () => {
  it('every kind starts complete and valid', () => {
    for (const k of EVENT_KINDS) {
      const s = starter(k);
      expect(normalizeInvitation(s)).toEqual(s);
      expect(s.moments.length).toBeGreaterThan(0);
    }
  });

  it('switching kind keeps what the host already typed', () => {
    const s = starter('botez', { ...SAMPLE, hosts: 'Sofia' });
    expect(s.hosts).toBe('Sofia');
    expect(s.date).toBe(SAMPLE.date);
    expect(s.kind).toBe('botez');
  });
});
