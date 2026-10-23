import { openHash } from '../inv/link';
import { documentTitle, renderBody, renderCss } from '../inv/render';
import { wire } from '../inv/wire';

/**
 * The viewer: reads the URL fragment (which never reaches any server),
 * unfolds it, and becomes the invitation that was travelling inside the link.
 */

function show(): void {
  const opened = openHash(location.hash);
  if (!opened) {
    const el = document.getElementById('fallback');
    if (el) {
      el.innerHTML =
        '<p>Linkul acesta nu pare să conțină o invitație. Poate s-a tăiat când a fost copiat.</p>' +
        `<p><a href="${location.origin}/">Fă-ți propria invitație, gratuit</a></p>`;
    }
    return;
  }
  const { inv, guest } = opened;
  const o = { base: location.origin, guest, envelope: true, today: new Date() };
  document.title = documentTitle(inv);
  const style = document.createElement('style');
  style.textContent = renderCss(inv, o);
  document.head.appendChild(style);
  document.documentElement.className = 'is-sealed';
  document.body.innerHTML = renderBody(inv, o);
  wire(document, inv, { link: location.href, go: (url) => location.assign(url) });
}

addEventListener('hashchange', () => location.reload());

if (typeof document !== 'undefined' && document.getElementById('fallback')) {
  show();
}
