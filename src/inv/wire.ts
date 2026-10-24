import { googleCalendarUrl, icsFile } from './calendar';
import { rsvpUrl } from './rsvp';
import { petals } from './scenes';
import { music, musicOff, setMusicOff, type Music } from './music';
import { sound, type Sound } from './sound';
import type { Invitation, MusicId } from './types';

export interface WireOpts {
  /** The link the calendar entry points back to. */
  link: string;
  /** How to leave for WhatsApp: the viewer navigates, the editor preview opens a tab. */
  go: (url: string) => void;
}

/** Gives a rendered invitation its behaviour. Works on any document (viewer or preview iframe). */
export function wire(doc: Document, inv: Invitation, o: WireOpts): void {
  const root = doc.documentElement;
  const win = doc.defaultView;

  // The entrance scene plays between the opening tap and the page. Without
  // one (or with reduced motion) the page shows straight away.
  const stage = doc.querySelector<HTMLElement>('[data-stage]');
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-petals]');
  const reduced = !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const taps = stage ? Array.from(stage.querySelectorAll<HTMLElement>('[data-tap]')) : [];
  let snd: Sound | null = null;
  let hurryFx: (() => void) | null = null;
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => {
    if (win) timers.push(win.setTimeout(fn, ms));
  };
  const buzz = (ms: number) => {
    try {
      win?.navigator.vibrate?.(ms);
    } catch {
      // vibration is a nicety; some browsers throw when it is blocked
    }
  };

  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    timers.forEach((id) => win?.clearTimeout(id));
    root.classList.add('is-shown');
    if (!hurryFx) canvas?.remove();
    if (stage) {
      // The scene keeps its last frame while it fades, then goes.
      root.classList.add('post');
      stage.classList.add('st-out');
      win?.setTimeout(() => {
        stage.remove();
        root.classList.remove('is-playing');
      }, 900);
    } else {
      root.classList.remove('is-playing');
    }
  };

  // Confetti and petals keep falling a little over the page after the scene ends.
  const startFx = () => {
    if (canvas && win && !hurryFx && !shown) hurryFx = petals(canvas, win);
  };

  let done = false;
  const finish = () => {
    if (done || !stage) return;
    done = true;
    stage.classList.add('st-done');
    snd?.play(stage.dataset.done ?? '');
    if (canvas?.dataset.at === 'done') startFx();
    later(show, Number(stage.dataset.after) || 2000);
  };
  const tap = (el: HTMLElement) => {
    if (el.classList.contains('off') || shown) return;
    el.classList.add('off');
    snd?.play(el.dataset.sfx ?? '');
    buzz(12);
    if (taps.every((x) => x.classList.contains('off'))) finish();
  };
  taps.forEach((el) => el.addEventListener('click', () => tap(el)));

  // Background music: started by the opening tap, with its own button on the page.
  const musicBtn = doc.querySelector<HTMLElement>('[data-music]');
  const sndBtn = stage?.querySelector<HTMLElement>('[data-snd]') ?? null;
  let tune: Music | null = null;
  const mark = () => {
    if (!snd) return;
    const off = snd.muted();
    sndBtn?.setAttribute('aria-pressed', String(off));
    sndBtn?.setAttribute('aria-label', off ? 'Pornește sunetul' : 'Fără sunet');
    const on = !!tune?.playing() && !off;
    musicBtn?.setAttribute('aria-pressed', String(on));
    musicBtn?.setAttribute('aria-label', on ? 'Oprește muzica' : 'Pornește muzica');
  };
  const startMusic = (w: Window, s: Sound, id: MusicId) => {
    tune = music(s, w, id);
    if (!musicOff(w) && !s.muted()) tune.start();
    if (musicBtn) {
      musicBtn.hidden = false;
      musicBtn.addEventListener('click', () => {
        if (!tune) return;
        if (tune.playing() && !s.muted()) {
          tune.stop();
          setMusicOff(w, true);
        } else {
          if (s.muted()) s.toggle();
          tune.start();
          setMusicOff(w, false);
        }
        mark();
      });
    }
    // A phone in a pocket should not keep playing to nobody.
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) void s.ac.suspend?.();
      else if (tune?.playing()) void s.ac.resume?.();
    });
  };

  const open = () => {
    root.classList.remove('is-sealed');
    root.classList.add('is-open');
    buzz(35);
    const env = doc.querySelector<HTMLElement>('[data-env]');
    if (env) win?.setTimeout(() => env.remove(), 1800);
    const plays = !!stage && !reduced && !!win;
    // Audio may only start inside the guest's tap, which is where we are.
    if (win && (plays || inv.music)) snd = sound(win);
    if (!snd) sndBtn?.remove();
    else {
      if (inv.music && win) startMusic(win, snd, inv.music);
      sndBtn?.addEventListener('click', () => {
        snd!.toggle();
        mark();
      });
      mark();
    }
    if (!stage || !plays || !win) {
      stage?.remove();
      canvas?.remove();
      show();
      return;
    }
    root.classList.add('is-playing');
    for (const cue of (stage.dataset.cues ?? '').split(',').filter(Boolean)) {
      const [name, at] = cue.split('@');
      later(() => snd?.play(name), Number(at) || 0);
    }
    later(show, Number(stage.dataset.stage) || 4000);
    // A guest who only watches gets the candles blown and the balloons popped.
    if (taps.length && stage.dataset.auto) {
      later(() => {
        taps.filter((x) => !x.classList.contains('off')).forEach((x, i) => later(() => tap(x), i * 380));
      }, Number(stage.dataset.auto));
    }
    if (canvas && canvas.dataset.at !== 'done') later(startFx, Number(canvas.dataset.at) || 1500);
  };
  const skip = () => {
    hurryFx?.();
    show();
  };
  doc.querySelector('[data-open]')?.addEventListener('click', open);
  doc.querySelector('[data-skip]')?.addEventListener('click', skip);
  if (root.classList.contains('is-open')) show();

  // A photo lives on someone else's server and can vanish. Without it the
  // invitation must look as if there never was one.
  doc.querySelectorAll<HTMLImageElement>('img[data-photo]').forEach((img) => {
    const drop = () => {
      img.closest('.has-photo')?.classList.remove('has-photo');
      img.closest('[data-photo-box]')?.remove();
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) drop();
    else img.addEventListener('error', drop, { once: true });
  });

  const items = Array.from(doc.querySelectorAll<HTMLElement>('main > .rv, main .sec .rv, main .sec.rv'));
  const IO = win && 'IntersectionObserver' in win ? win.IntersectionObserver : null;
  if (IO) {
    const io = new IO(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  const form = doc.querySelector<HTMLFormElement>('[data-rsvp]');
  if (form) {
    const sync = () => {
      const coming = (form.elements.namedItem('coming') as RadioNodeList | null)?.value !== 'nu';
      form.classList.toggle('is-not-coming', !coming);
    };
    form.addEventListener('change', sync);
    sync();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (n: string) => {
        const el = form.elements.namedItem(n) as HTMLInputElement | RadioNodeList | null;
        return el ? String(el.value) : '';
      };
      const nameEl = form.elements.namedItem('name') as HTMLInputElement | null;
      if (nameEl && !nameEl.value.trim()) {
        nameEl.focus();
        return;
      }
      const url = rsvpUrl(inv, {
        name: val('name'),
        coming: val('coming') !== 'nu',
        adults: Number(val('adults') || 1),
        kids: Number(val('kids') || 0),
        veg: Number(val('veg') || 0),
        message: val('message'),
      });
      if (url) o.go(url);
    });
  }

  const g = doc.querySelector<HTMLAnchorElement>('[data-gcal]');
  if (g) {
    const href = googleCalendarUrl(inv, o.link);
    if (href) g.href = href;
    else g.remove();
  }
  doc.querySelector('[data-ics]')?.addEventListener('click', () => {
    const ics = icsFile(inv, o.link);
    if (!ics || !win) return;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = doc.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'invitatie.ics';
    doc.body.appendChild(a);
    a.click();
    a.remove();
    win.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}
