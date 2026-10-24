import { googleCalendarUrl, icsFile } from './calendar';
import { rsvpUrl } from './rsvp';
import { petals } from './scenes';
import type { Invitation } from './types';

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
  let hurryPetals = () => {};
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    root.classList.remove('is-playing');
    root.classList.add('is-shown');
    if (stage) {
      root.classList.add('post');
      stage.classList.add('st-out');
      win?.setTimeout(() => stage.remove(), 900);
    }
  };

  const open = () => {
    root.classList.remove('is-sealed');
    root.classList.add('is-open');
    try {
      win?.navigator.vibrate?.(35);
    } catch {
      // vibration is a nicety; some browsers throw when it is blocked
    }
    const env = doc.querySelector<HTMLElement>('[data-env]');
    if (env) win?.setTimeout(() => env.remove(), 1800);
    if (!stage || reduced || !win) {
      stage?.remove();
      canvas?.remove();
      show();
      return;
    }
    root.classList.add('is-playing');
    win.setTimeout(show, Number(stage.dataset.stage) || 4000);
    // Petals keep falling a little over the page after the scene ends.
    if (canvas) {
      win.setTimeout(() => {
        if (skipped) canvas.remove();
        else hurryPetals = petals(canvas, win);
      }, 1500);
    }
  };
  let skipped = false;
  const skip = () => {
    skipped = true;
    hurryPetals();
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
