import { useEffect, useRef, useState } from 'react';
import { renderBody, renderCss } from '../inv/render';
import { wire } from '../inv/wire';
import type { Invitation } from '../inv/types';

interface Props {
  inv: Invitation;
  guest?: string;
  /** What a guest's "send on WhatsApp" does inside the preview. */
  onRsvp: (url: string) => void;
  title?: string;
}

/**
 * Live preview. The iframe is created once; each change rewrites its style and
 * body in place, so typing never flashes the page or loses the scroll position.
 */
export function Preview({ inv, guest = '', onRsvp, title = 'Previzualizarea invitației' }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const rsvp = useRef(onRsvp);
  rsvp.current = onRsvp;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!ready || !doc || !doc.body) return;
    const o = { base: location.origin, guest, envelope: false, today: new Date() };
    let style = doc.getElementById('inv-css');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'inv-css';
      doc.head.appendChild(style);
    }
    style.textContent = renderCss(inv, o);
    const y = doc.defaultView?.scrollY ?? 0;
    doc.documentElement.className = 'is-open no-env';
    doc.body.innerHTML = renderBody(inv, o);
    doc.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
    wire(doc, inv, { link: location.href, go: (url) => rsvp.current(url) });
    doc.defaultView?.scrollTo(0, y);
  });

  return (
    <iframe
      ref={frame}
      className="preview-frame"
      title={title}
      srcDoc='<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'
      onLoad={() => setReady(true)}
    />
  );
}
