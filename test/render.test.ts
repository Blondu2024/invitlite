import { describe, expect, it, vi } from 'vitest';
import { renderBody, renderCss, renderDocument, mapHref } from '../src/inv/render';
import { wire } from '../src/inv/wire';
import { SAMPLE } from '../src/inv/defaults';
import { TEMPLATE_IDS, type Invitation } from '../src/inv/types';

const o = { base: 'https://invitlite.app', guest: '', envelope: true, today: new Date(2027, 0, 1) };

function mount(inv: Invitation, opts = o): Document {
  const doc = document.implementation.createHTMLDocument('t');
  doc.documentElement.innerHTML = renderDocument(inv, opts).replace(/^<!doctype html><html[^>]*>/, '').replace(/<\/html>$/, '');
  return doc;
}

describe('render', () => {
  it('escapes everything that came from the link', () => {
    const evil = '<img src=x onerror=alert(1)>"\'';
    const inv: Invitation = {
      ...SAMPLE,
      hosts: evil,
      city: evil,
      intro: evil,
      message: evil,
      parents: evil,
      godparents: evil,
      note: evil,
      moments: [{ title: evil, time: '10:00', place: evil, address: evil, mapUrl: 'javascript:alert(1)' }],
    };
    for (const t of TEMPLATE_IDS) {
      const html = renderBody({ ...inv, template: t }, { ...o, guest: evil });
      expect(html).not.toContain('<img');
      expect(html).not.toContain('javascript:');
    }
  });

  it('every template renders the names, the date and the program', () => {
    for (const t of TEMPLATE_IDS) {
      const html = renderBody({ ...SAMPLE, template: t }, o);
      expect(html).toContain('Mihai');
      expect(html).toContain('sâmbătă, 12 iunie 2027');
      expect(html).toContain('Biserica Sf. Nicolae');
      expect(html).toContain('Programul zilei');
    }
  });

  it('greets a personal guest on the envelope and in the hero', () => {
    const html = renderBody(SAMPLE, { ...o, guest: 'Familia Popescu' });
    expect(html).toContain('Pentru Familia Popescu');
    expect(html).toContain('Dragă Familia Popescu,');
    expect(html).toContain('value="Familia Popescu"');
  });

  it('shows the countdown in Romanian', () => {
    expect(renderBody(SAMPLE, o)).toContain('Mai sunt 162 de zile');
  });

  it('no WhatsApp number means no form', () => {
    const html = renderBody({ ...SAMPLE, rsvpPhone: '' }, o);
    expect(html).not.toContain('data-rsvp');
  });

  it('only asks what the host wants to know', () => {
    const html = renderBody({ ...SAMPLE, askKids: false, askMenu: false }, o);
    expect(html).not.toContain('name="kids"');
    expect(html).not.toContain('name="veg"');
  });

  it('maps fall back to a Google Maps search, never a script', () => {
    expect(mapHref({ title: '', time: '', place: 'Sala X', address: 'Galați', mapUrl: '' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Sala%20X%2C%20Gala%C8%9Bi',
    );
    expect(mapHref({ title: '', time: '', place: '', address: '', mapUrl: 'https://maps.app.goo.gl/abc' })).toBe(
      'https://maps.app.goo.gl/abc',
    );
  });

  it('fonts are self-hosted, nothing loads from Google', () => {
    const css = renderCss(SAMPLE, o);
    expect(css).toContain('https://invitlite.app/fonts/');
    expect(css).not.toContain('googleapis');
  });
});

describe('wire', () => {
  it('opens the envelope', () => {
    const doc = mount(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(doc.documentElement.classList.contains('is-open')).toBe(true);
  });

  it('sends the RSVP to WhatsApp with the form values', () => {
    const doc = mount(SAMPLE, { ...o, guest: 'Familia Popescu' });
    const go = vi.fn();
    wire(doc, SAMPLE, { link: 'L', go });
    const form = doc.querySelector('[data-rsvp]') as HTMLFormElement;
    (form.elements.namedItem('adults') as HTMLSelectElement).value = '2';
    (form.elements.namedItem('kids') as HTMLSelectElement).value = '1';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(go).toHaveBeenCalledTimes(1);
    const text = decodeURIComponent(go.mock.calls[0][0].split('text=')[1]);
    expect(text).toContain('Nume: Familia Popescu');
    expect(text).toContain('Persoane: 2 adulți, 1 copil');
  });

  it('will not send without a name', () => {
    const doc = mount(SAMPLE);
    const go = vi.fn();
    wire(doc, SAMPLE, { link: 'L', go });
    doc.querySelector('[data-rsvp]')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(go).not.toHaveBeenCalled();
  });

  it('hides head counts when the answer is no', () => {
    const doc = mount(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    const form = doc.querySelector('[data-rsvp]') as HTMLFormElement;
    (form.querySelector('input[value="nu"]') as HTMLInputElement).checked = true;
    form.dispatchEvent(new Event('change'));
    expect(form.classList.contains('is-not-coming')).toBe(true);
  });

  it('points the calendar button at Google Calendar', () => {
    const doc = mount(SAMPLE);
    wire(doc, SAMPLE, { link: 'https://x/i/#v1.a', go: () => {} });
    expect((doc.querySelector('[data-gcal]') as HTMLAnchorElement).href).toContain('calendar.google.com');
  });
});

describe('motifs and photo', () => {
  it('each event has its own drawing, in every style', () => {
    const want: Record<string, string> = { nunta: 'm-rings', botez: 'm-dove', cununie: 'm-bouquet', aniversare: 'm-cake' };
    const small: Record<string, string> = { nunta: 'm-flower', botez: 'm-candle', cununie: 'm-rings-s', aniversare: 'm-balloons' };
    for (const t of TEMPLATE_IDS) {
      for (const k of Object.keys(want)) {
        const html = renderBody({ ...SAMPLE, template: t, kind: k as Invitation['kind'] }, o);
        expect(html, `${t}/${k}`).toContain(want[k]);
        expect(html, `${t}/${k}`).toContain(small[k]);
      }
    }
  });

  it('the envelope carries the motif too', () => {
    expect(renderBody({ ...SAMPLE, kind: 'botez' }, o)).toMatch(/env-motif m-dove/);
  });

  it('renders the photo in every style, without leaking the referrer', () => {
    const inv = { ...SAMPLE, photo: 'https://i.postimg.cc/abc/poza.jpg' };
    for (const t of TEMPLATE_IDS) {
      const html = renderBody({ ...inv, template: t }, o);
      expect(html).toContain('src="https://i.postimg.cc/abc/poza.jpg"');
      expect(html).toContain('referrerpolicy="no-referrer"');
      expect(html).toContain('data-photo-box');
    }
  });

  it('no photo, no frame', () => {
    for (const t of TEMPLATE_IDS) {
      expect(renderBody({ ...SAMPLE, template: t }, o)).not.toContain('data-photo');
    }
  });

  it('a photo that fails to load disappears and takes its frame with it', () => {
    const inv = { ...SAMPLE, template: 'botanic' as const, photo: 'https://example.invalid/x.jpg' };
    const doc = mount(inv);
    wire(doc, inv, { link: 'L', go: () => {} });
    doc.querySelector('img[data-photo]')?.dispatchEvent(new Event('error'));
    expect(doc.querySelector('[data-photo-box]')).toBeNull();
    expect(doc.querySelector('.has-photo')).toBeNull();
    expect(doc.querySelector('.motif')).not.toBeNull();
  });
});
