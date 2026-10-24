/** Everything in a SiteConfig arrives from a URL anyone can craft. Trust nothing. */

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Image sources: only absolute http(s). Anything else renders as no image. */
export function safeImageUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\/[^\s]+$/i.test(t)) return t;
  return '';
}

/** Contact hrefs: http(s), tel:, mailto: — everything else is dropped. */
export function safeHref(url: string): string {
  const t = url.trim();
  if (/^https?:\/\/[^\s]+$/i.test(t)) return t;
  if (/^tel:\+?[0-9 ().-]{3,24}$/i.test(t)) return 'tel:' + t.slice(4).replace(/[^+0-9]/g, '');
  if (/^mailto:[^\s<>"']+@[^\s<>"']+$/i.test(t)) return t;
  return '';
}

/** Builds a tel: href from a free-typed phone number. */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^+0-9]/g, '');
  return digits.length >= 3 ? 'tel:' + digits : '';
}

/** Photos: https only (an http image on an https page is blocked anyway). */
export function safePhotoUrl(url: string): string {
  const t = url.trim();
  // http only for a photo server running on the host's own machine, in development
  return /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/)[^\s"'<>]+$/i.test(t) ? t : '';
}

/**
 * Links people paste that are a web page about a photo, not the photo itself.
 * Returns a hint for the editor, or '' when the link looks like a real image.
 */
export function photoLinkHint(url: string): string {
  const t = url.trim();
  if (!t) return '';
  if (!/^https:\/\//i.test(t)) return 'Linkul trebuie să înceapă cu https://';
  let host = '';
  try {
    host = new URL(t).hostname.toLowerCase();
  } catch {
    return 'Linkul nu pare complet.';
  }
  if (/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host))
    return 'Acesta e linkul paginii de Facebook, nu al pozei. Deschide poza, ține apăsat pe ea și alege „Copiază adresa imaginii". Atenție: linkurile pozelor de Facebook expiră după câteva săptămâni.';
  if (/(^|\.)fbcdn\.net$/.test(host))
    return 'Merge, dar linkurile pozelor de Facebook expiră după câteva săptămâni. Pentru o invitație trimisă cu mult înainte, urcă poza pe postimages.org.';
  if (host === 'photos.google.com' || host === 'photos.app.goo.gl')
    return 'Acesta e linkul albumului Google Photos, nu al pozei. Deschide poza, ține apăsat pe ea și alege „Copiază adresa imaginii".';
  if (host === 'imgur.com' || host === 'www.imgur.com')
    return 'Acesta e linkul paginii Imgur. Ține apăsat pe poză și alege „Copiază adresa imaginii" (începe cu i.imgur.com).';
  if (host === 'postimg.cc' || host === 'www.postimg.cc')
    return 'Acesta e linkul paginii. Pe postimages alege „Direct link" (începe cu i.postimg.cc).';
  return '';
}

export function safeColor(c: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(c.trim()) ? c.trim() : fallback;
}
