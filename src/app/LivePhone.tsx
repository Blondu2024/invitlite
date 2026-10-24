import { useEffect, useRef } from 'react';
import { renderBody, renderCss } from '../inv/render';
import { wire } from '../inv/wire';
import type { Invitation } from '../inv/types';

interface Props {
  inv: Invitation;
  /** What "send on WhatsApp" does on the landing page. */
  onRsvp: (url: string) => void;
}

const BLANK =
  '<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>';

/**
 * A sealed invitation, exactly as a guest receives it: envelope, scene, sound
 * and music, run by the same code as the real link. The parent remounts it
 * (with a new key) to switch kinds or play it again, which also silences the
 * old one: its window, timers and audio go with the iframe.
 */
export function LivePhone({ inv, onRsvp }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const rsvp = useRef(onRsvp);
  rsvp.current = onRsvp;

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fill = () => {
      const doc = el.contentDocument;
      if (!doc?.body || doc.body.dataset.filled) return;
      doc.body.dataset.filled = '1';
      const o = { base: location.origin, guest: '', envelope: true, today: new Date() };
      const style = doc.createElement('style');
      style.textContent = renderCss(inv, o);
      doc.head.appendChild(style);
      doc.documentElement.className = 'is-sealed';
      doc.body.innerHTML = renderBody(inv, o);
      wire(doc, inv, { link: location.href, go: (url) => rsvp.current(url) });
    };
    if (el.contentDocument?.readyState === 'complete') fill();
    el.addEventListener('load', fill);
    return () => el.removeEventListener('load', fill);
  }, [inv]);

  return <iframe ref={frame} className="preview-frame" title="Invitație de încercat: atinge sigiliul" srcDoc={BLANK} />;
}
