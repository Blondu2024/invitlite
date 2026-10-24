import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderBody, renderCss, renderDocument, mapHref } from '../src/inv/render';
import { wire } from '../src/inv/wire';
import { SAMPLE, SAMPLE_FILM } from '../src/inv/defaults';
import { EVENT_KINDS, MUSIC_IDS, TEMPLATE_IDS, type Invitation } from '../src/inv/types';
import { chord, tuneLength, tuneNotes } from '../src/inv/music';
import { starter } from '../src/inv/defaults';
import { normalizeInvitation } from '../src/inv/normalize';
import { AUTO_MS, SCENE_MS, splitNames } from '../src/inv/scenes';
import { sound } from '../src/inv/sound';

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
      expect(html).not.toContain('<img src=x');
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

/** Just enough Web Audio to count what gets scheduled. */
function fakeAudio() {
  const made = { osc: 0, gains: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
  });
  const node = () => ({ connect: (n: unknown) => n, gain: param(), frequency: param(), Q: param() });
  class AC {
    currentTime = 0;
    sampleRate = 8000;
    state = 'running';
    destination = {};
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
    createGain() {
      made.gains++;
      return node();
    }
    createBiquadFilter() {
      return { ...node(), type: '' };
    }
    createConvolver() {
      return { ...node(), buffer: null };
    }
    createOscillator() {
      made.osc++;
      return { ...node(), type: '', start() {}, stop() {} };
    }
    createBuffer(_c: number, n: number) {
      const d = new Float32Array(n);
      return { getChannelData: () => d };
    }
    createBufferSource() {
      return { ...node(), buffer: null, loop: false, start() {}, stop() {} };
    }
  }
  return { AC, made };
}

function fakeWindow() {
  const { AC, made } = fakeAudio();
  const store = new Map<string, string>();
  const win = {
    AudioContext: AC,
    navigator: {},
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: () => 1,
    clearTimeout() {},
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  } as unknown as Window;
  return { win, made, store };
}

// jsdom has no canvas; the petals must bow out quietly instead of failing.
HTMLCanvasElement.prototype.getContext = (() => null) as never;

/** The real jsdom document: it has a window, so timers and matchMedia apply. */
function live(inv: Invitation): Document {
  document.documentElement.className = 'is-sealed';
  document.body.innerHTML = renderBody(inv, o);
  return document;
}

describe('entrance scenes', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('every kind plays its own scene after the envelope', () => {
    const html = renderBody(SAMPLE, o);
    expect(html).toContain('st-couple');
    expect(html).toContain('data-petals');
    const want: Record<Invitation['kind'], string> = {
      nunta: 'st-wed',
      botez: 'st-bap',
      cununie: 'st-civ',
      aniversare: 'st-bd',
      copii: 'st-kid',
      film: 'st-film',
    };
    for (const k of EVENT_KINDS) {
      const h = renderBody({ ...SAMPLE, kind: k }, o);
      expect(h, k).toContain(want[k]);
      expect(h, k).toContain('data-skip');
      expect(h, k).toContain('data-snd');
      expect(h, k).toMatch(/data-cues="[a-z]+@\d+/);
    }
  });

  it('the scenes escape the names they show', () => {
    const evil = '<img src=x onerror=alert(1)>';
    for (const k of EVENT_KINDS) {
      const inv = { ...SAMPLE, kind: k, hosts: evil, city: evil, moments: [{ ...SAMPLE.moments[0], place: evil }] };
      expect(renderBody(inv, { ...o, guest: evil }), k).not.toContain('<img src=x');
    }
  });

  it('the editor preview never plays a scene', () => {
    const html = renderBody(SAMPLE, { ...o, envelope: false });
    expect(html).not.toContain('data-stage');
    expect(html).not.toContain('data-env');
  });

  it('opening plays the scene, then shows the page and clears the stage', () => {
    vi.useFakeTimers();
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    const root = doc.documentElement;
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(root.classList.contains('is-playing')).toBe(true);
    expect(root.classList.contains('is-shown')).toBe(false);
    vi.advanceTimersByTime(7800);
    expect(root.classList.contains('is-shown')).toBe(true);
    // the scene holds its last frame while it fades out
    expect(doc.querySelector('[data-stage]')?.classList.contains('st-out')).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(root.classList.contains('is-playing')).toBe(false);
    expect(doc.querySelector('[data-stage]')).toBeNull();
    expect(doc.querySelector('canvas[data-petals]')).toBeNull();
  });

  it('"sari peste" shows the page at once', () => {
    vi.useFakeTimers();
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(doc.documentElement.classList.contains('is-shown')).toBe(false);
    (doc.querySelector('[data-skip]') as HTMLButtonElement).click();
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(doc.querySelector('canvas[data-petals]')).toBeNull();
  });

  it('reduced motion skips the scene entirely', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (q: string) => ({ matches: q.includes('reduce') }),
    });
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
    expect(doc.querySelector('[data-stage]')).toBeNull();
  });

  it('the film countdown is shorter than the wedding', () => {
    vi.useFakeTimers();
    const doc = live(SAMPLE_FILM);
    wire(doc, SAMPLE_FILM, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(3900);
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
  });

  it('without Web Audio the mute button goes away and nothing breaks', () => {
    vi.useFakeTimers();
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(doc.querySelector('[data-snd]')).toBeNull();
    vi.advanceTimersByTime(7800);
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
  });

  it('the other scenes run to the end on their own', () => {
    for (const k of ['botez', 'cununie'] as const) {
      vi.useFakeTimers();
      const inv = { ...SAMPLE, kind: k };
      const doc = live(inv);
      wire(doc, inv, { link: 'L', go: () => {} });
      (doc.querySelector('[data-open]') as HTMLButtonElement).click();
      vi.advanceTimersByTime(SCENE_MS[k]! - 1);
      expect(doc.documentElement.classList.contains('is-shown'), k).toBe(false);
      vi.advanceTimersByTime(1);
      expect(doc.documentElement.classList.contains('is-shown'), k).toBe(true);
      vi.useRealTimers();
    }
  });
});

describe('scenes you touch', () => {
  afterEach(() => vi.useRealTimers());

  const BDAY: Invitation = { ...SAMPLE, kind: 'aniversare', hosts: 'Bunicul Ion, 70 de ani' };
  const KIDS: Invitation = {
    ...SAMPLE,
    kind: 'copii',
    hosts: 'Matei, 4 ani',
    moments: [{ title: 'Petrecerea', time: '16:00', place: 'Locul de joacă Arca', address: '', mapUrl: '' }],
  };

  function open(inv: Invitation): Document {
    vi.useFakeTimers();
    const doc = live(inv);
    wire(doc, inv, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    return doc;
  }
  const taps = (doc: Document) => Array.from(doc.querySelectorAll<HTMLButtonElement>('[data-tap]'));

  it('the cake has as many candles as a small child has years, else three', () => {
    expect(renderBody({ ...BDAY, hosts: 'Sofia, 2 ani' }, o).match(/class="bd-c"/g)).toHaveLength(2);
    expect(renderBody(BDAY, o).match(/class="bd-c"/g)).toHaveLength(3);
    expect(renderBody(BDAY, o)).toContain('class="bd-age" aria-hidden="true">70<');
  });

  it('blowing out every candle ends the birthday scene', () => {
    const doc = open(BDAY);
    const [a, b, c] = taps(doc);
    a.click();
    b.click();
    expect(doc.querySelector('.st-done')).toBeNull();
    c.click();
    expect(doc.querySelector('.st-done')).not.toBeNull();
    expect(doc.documentElement.classList.contains('is-shown')).toBe(false);
    vi.advanceTimersByTime(2600);
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
  });

  it('a guest who only watches still gets to the invitation', () => {
    const doc = open(BDAY);
    vi.advanceTimersByTime(AUTO_MS + 3 * 380);
    expect(taps(doc).every((x) => x.classList.contains('off'))).toBe(true);
    vi.advanceTimersByTime(2600);
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
  });

  it('the balloons hide when, what time and where', () => {
    const html = renderBody(KIDS, o);
    expect(html).toContain('sâmbătă, 12 iunie<');
    expect(html).toContain('16:00');
    expect(html).toContain('Locul de joacă Arca');
    const doc = open(KIDS);
    for (const b of taps(doc)) b.click();
    expect(taps(doc).every((x) => x.classList.contains('off'))).toBe(true);
    vi.advanceTimersByTime(2800);
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
  });

  it('a balloon pops once; a missing date or place still reads well', () => {
    const html = renderBody({ ...KIDS, date: '', city: '', moments: [] }, o);
    expect(html).toContain('În curând');
    expect(html).toContain('Vă anunțăm');
    expect(html).toContain('La noi');
    const doc = open(KIDS);
    const [first] = taps(doc);
    first.click();
    first.click();
    expect(doc.querySelector('.st-done')).toBeNull();
  });

  it('skip works in the middle of the taps', () => {
    const doc = open(KIDS);
    taps(doc)[0].click();
    (doc.querySelector('[data-skip]') as HTMLButtonElement).click();
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
    vi.advanceTimersByTime(60000);
    expect(doc.querySelector('[data-stage]')).toBeNull();
  });
});

describe('civil wedding names', () => {
  it('splits the couple however the host wrote it', () => {
    expect(splitNames('Ana & Mihai')).toEqual(['Ana', 'Mihai']);
    expect(splitNames('Ana și Mihai')).toEqual(['Ana', 'Mihai']);
    expect(splitNames('Ana si Mihai')).toEqual(['Ana', 'Mihai']);
    expect(splitNames('Sinziana')).toEqual(['Sinziana']);
    expect(splitNames('')).toEqual([]);
  });

  it('writes both names and stamps the date', () => {
    const html = renderBody({ ...SAMPLE, kind: 'cununie' }, o);
    expect(html.match(/class="civ-name"/g)).toHaveLength(2);
    expect(html).toContain('CUNUNIA CIVILĂ · 12.06.2027 ·');
    expect(html).toContain('scratch@1500,scratch@3000');
  });
});

describe('sound', () => {

  it('plays every effect the scenes ask for', () => {
    const { win, made } = fakeWindow();
    const s = sound(win)!;
    const names = new Set<string>();
    for (const k of EVENT_KINDS) {
      const html = renderBody({ ...SAMPLE, kind: k }, o);
      for (const m of html.matchAll(/data-(?:cues|sfx|done)="([^"]+)"/g)) {
        for (const c of m[1].split(',')) names.add(c.split('@')[0]);
      }
    }
    // a misspelt cue would play nothing at all, so each name must build some sound
    for (const n of names) {
      const before = made.gains;
      s.play(n);
      expect(made.gains, n).toBeGreaterThan(before);
    }
    expect(names.size).toBeGreaterThan(8);
  });

  it('mute is quiet and remembered on the phone', () => {
    const { win, made, store } = fakeWindow();
    const s = sound(win)!;
    expect(s.toggle()).toBe(true);
    expect(store.get('invitlite-sunet')).toBe('off');
    const before = made.osc;
    s.play('chime');
    expect(made.osc).toBe(before);
    expect(sound(win)!.muted()).toBe(true);
    s.toggle();
    expect(store.has('invitlite-sunet')).toBe(false);
  });

  it('no Web Audio, no sound object', () => {
    expect(sound({ navigator: {} } as unknown as Window)).toBeNull();
  });

  it('the editor can listen without touching the guest mute', () => {
    const { win, store } = fakeWindow();
    store.set('invitlite-sunet', 'off');
    const s = sound(win, { remember: false })!;
    expect(s.muted()).toBe(false);
    s.toggle();
    expect(store.get('invitlite-sunet')).toBe('off');
  });
});

describe('background music', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (window as { AudioContext?: unknown }).AudioContext;
    localStorage.clear();
  });

  it('every tune is well formed: notes inside their bar, in a playable range', () => {
    for (const id of MUSIC_IDS) {
      const { bars, beats, bpm } = tuneLength(id);
      const notes = tuneNotes(id);
      expect(bpm).toBeGreaterThan(50);
      expect(new Set(notes.map((x) => x.bar)).size, id).toBe(bars);
      for (const { note } of notes) {
        expect(note.at, id).toBeGreaterThanOrEqual(0);
        expect(note.at, id).toBeLessThan(beats);
        expect(note.dur, id).toBeGreaterThan(0);
        expect(note.midi, id).toBeGreaterThanOrEqual(0);
        expect(note.midi, id).toBeLessThanOrEqual(96);
        expect(Number.isFinite(note.vel) && note.vel > 0 && note.vel <= 1, id).toBe(true);
      }
    }
  });

  it('reads chord names', () => {
    expect(chord('Bbmaj7')).toEqual({ pc: 10, iv: [0, 4, 7, 11] });
    expect(chord('Dm')).toEqual({ pc: 2, iv: [0, 3, 7] });
    expect(chord('F7').iv).toEqual([0, 4, 7, 10]);
  });

  it('each kind starts with its own tune; old links stay quiet', () => {
    expect(starter('nunta').music).toBe('vals');
    expect(starter('film').music).toBe('jazz');
    const { music: _m, ...old } = SAMPLE;
    expect(normalizeInvitation(old).music).toBe('');
    expect(normalizeInvitation({ ...SAMPLE, music: 'rock' }).music).toBe('');
  });

  it('the music switch is on the invitation, never in the editor preview', () => {
    expect(renderBody(SAMPLE, o)).toContain('data-music');
    expect(renderBody(SAMPLE, { ...o, envelope: false })).not.toContain('data-music');
    expect(renderBody({ ...SAMPLE, music: '' }, o)).not.toContain('data-music');
  });

  it('starts on the opening tap, and the guest can stop it for good', () => {
    vi.useFakeTimers();
    const { AC, made } = fakeAudio();
    (window as unknown as { AudioContext: unknown }).AudioContext = AC;
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    const btn = doc.querySelector('[data-music]') as HTMLButtonElement;
    expect(btn.hidden).toBe(true);
    const before = made.osc;
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(made.osc).toBeGreaterThan(before);
    expect(btn.hidden).toBe(false);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    btn.click();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('invitlite-muzica')).toBe('off');
    btn.click();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('invitlite-muzica')).toBeNull();
  });

  it('a guest who switched it off once is not surprised next time', () => {
    vi.useFakeTimers();
    localStorage.setItem('invitlite-muzica', 'off');
    const { AC } = fakeAudio();
    (window as unknown as { AudioContext: unknown }).AudioContext = AC;
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(doc.querySelector('[data-music]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('muting the scene silences the music too', () => {
    vi.useFakeTimers();
    const { AC } = fakeAudio();
    (window as unknown as { AudioContext: unknown }).AudioContext = AC;
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    (doc.querySelector('[data-snd]') as HTMLButtonElement).click();
    expect(doc.querySelector('[data-music]')?.getAttribute('aria-pressed')).toBe('false');
    // turning the music back on brings the sound back
    (doc.querySelector('[data-music]') as HTMLButtonElement).click();
    expect(doc.querySelector('[data-music]')?.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('invitlite-sunet')).toBeNull();
  });

  it('plays even when reduced motion skips the scene', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q: string) => ({ matches: q.includes('reduce') }) });
    const { AC, made } = fakeAudio();
    (window as unknown as { AudioContext: unknown }).AudioContext = AC;
    const doc = live(SAMPLE);
    wire(doc, SAMPLE, { link: 'L', go: () => {} });
    (doc.querySelector('[data-open]') as HTMLButtonElement).click();
    expect(doc.documentElement.classList.contains('is-shown')).toBe(true);
    expect(made.osc).toBeGreaterThan(0);
    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});

describe('film night', () => {
  it('opens on a curtain and a countdown, not an envelope', () => {
    const html = renderBody(SAMPLE_FILM, o);
    expect(html).toContain('class="cur"');
    expect(html).toContain('Intră în sală');
    expect(html).toContain('st-film');
    expect(html).not.toContain('class="env"');
  });

  it('the invitation is a ticket with the guest, the title and a seat', () => {
    const html = renderBody(SAMPLE_FILM, { ...o, guest: 'Familia Popescu' });
    expect(html).toContain('class="tk ');
    expect(html).toContain('Maraton de comedii vechi');
    expect(html).toContain('Familia Popescu');
    expect(html).toMatch(/Rândul [A-L], locul \d+/);
    expect(html).toContain('Sufrageria noastră');
    expect(html).toContain('Popcorn cu unt');
    expect(html).toContain('Programul serii');
  });

  it('the same guest always gets the same seat', () => {
    const a = renderBody(SAMPLE_FILM, { ...o, guest: 'Ion' }).match(/Rândul [A-L], locul \d+/)?.[0];
    const b = renderBody(SAMPLE_FILM, { ...o, guest: 'ion ' }).match(/Rândul [A-L], locul \d+/)?.[0];
    expect(a).toBe(b);
    expect(renderBody(SAMPLE_FILM, o)).toContain('Unde vrei tu');
  });

  it('escapes the new fields', () => {
    const evil = '<img src=x onerror=alert(1)>';
    for (const t of TEMPLATE_IDS) {
      const html = renderBody({ ...SAMPLE_FILM, template: t, title: evil, snacks: evil }, { ...o, guest: evil });
      expect(html).not.toContain('<img src=x');
    }
  });

  it('works in every style and opens like the others', () => {
    for (const t of TEMPLATE_IDS) {
      const inv = { ...SAMPLE_FILM, template: t };
      const doc = mount(inv);
      wire(doc, inv, { link: 'L', go: () => {} });
      (doc.querySelector('[data-open]') as HTMLButtonElement).click();
      expect(doc.documentElement.classList.contains('is-open')).toBe(true);
      expect(doc.querySelector('.tk-title')?.textContent).toBe('Maraton de comedii vechi');
    }
  });
});

describe('motifs and photo', () => {
  it('each event has its own drawing, in every style', () => {
    const want: Record<string, string> = { nunta: 'm-rings', botez: 'm-dove', cununie: 'm-bouquet', aniversare: 'm-cake', copii: 'm-hat', film: 'm-reel' };
    const small: Record<string, string> = { nunta: 'm-flower', botez: 'm-candle', cununie: 'm-rings-s', aniversare: 'm-balloons', copii: 'm-pinwheel', film: 'm-popcorn' };
    for (const t of TEMPLATE_IDS) {
      for (const k of Object.keys(want)) {
        const html = renderBody({ ...SAMPLE, template: t, kind: k as Invitation['kind'] }, o);
        expect(html, `${t}/${k}`).toContain(want[k]);
        expect(html, `${t}/${k}`).toContain(small[k]);
      }
    }
  });

  it("the envelope lies on the kind's own photograph, or on the host's", () => {
    expect(renderBody({ ...SAMPLE, kind: 'botez' }, o)).toContain("--bp:url('https://invitlite.app/img/bg/botez-p.webp');--bl:url('https://invitlite.app/img/bg/botez-l.webp')");
    expect(renderBody({ ...SAMPLE, photo: 'https://i.postimg.cc/a/b.jpg' }, o)).toContain("--bp:url('https://i.postimg.cc/a/b.jpg')");
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

  it('without a photo of their own, every kind gets its own photograph, in every style', () => {
    for (const t of TEMPLATE_IDS) {
      for (const k of EVENT_KINDS) {
        const html = renderBody({ ...SAMPLE, template: t, kind: k }, o);
        expect(html, `${t}/${k}`).toContain('data-photo-box');
        expect(html, `${t}/${k}`).toMatch(new RegExp(`src="https://invitlite.app/img/bg/${k}-[pl].webp"`));
        expect(html, `${t}/${k}`).not.toContain('referrerpolicy');
      }
    }
  });

  it('every photograph the invitations point at ships with the site', async () => {
    const { existsSync } = await import('node:fs');
    for (const k of EVENT_KINDS) for (const s of ['p', 'l']) expect(existsSync(`public/img/bg/${k}-${s}.webp`), `${k}-${s}`).toBe(true);
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

describe('landing samples', () => {
  it('every kind has an example that survives the link and opens with its own scene', async () => {
    const { sampleFor } = await import('../src/inv/defaults');
    const { invitationHash, openHash } = await import('../src/inv/link');
    for (const k of EVENT_KINDS) {
      const inv = sampleFor(k);
      expect(inv.kind).toBe(k);
      expect(inv.music).not.toBe('');
      expect(openHash(invitationHash(inv, ''))?.inv).toEqual(normalizeInvitation(inv));
      expect(mount(inv).querySelector('.st')).not.toBeNull();
    }
  });
});
