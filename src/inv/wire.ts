import { googleCalendarUrl, icsFile } from './calendar';
import { rsvpUrl } from './rsvp';
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

  const open = () => {
    root.classList.remove('is-sealed');
    root.classList.add('is-open');
    const env = doc.querySelector<HTMLElement>('[data-env]');
    if (env) win?.setTimeout(() => env.remove(), 1800);
  };
  doc.querySelector('[data-open]')?.addEventListener('click', open);

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
