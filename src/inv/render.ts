import { daysUntil, dottedDate, hashName, initials, KIND_LABEL, longDate, roCount, seatFor, shortDate } from './format';
import { escHtml, safeHref } from './sanitize';
import { fontFaces, THEMES, type Theme } from './theme';
import { waNumber } from './rsvp';
import { mainMotif, smallMotif } from './motifs';
import { curtain, sceneCss, stage } from './scenes';
import type { Invitation, Moment } from './types';

export interface RenderOpts {
  /** Origin the fonts and the badge link resolve against. */
  base: string;
  guest: string;
  /** Show the envelope first. The editor preview skips it. */
  envelope: boolean;
  today: Date;
}

/** Paragraphs on blank lines, line breaks inside them. Everything escaped. */
function prose(s: string, cls = ''): string {
  return s
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${cls ? ` class="${cls}"` : ''}>${escHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function mapHref(m: Moment): string {
  const own = safeHref(m.mapUrl);
  if (own.startsWith('http')) return own;
  const q = [m.place, m.address].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

const PIN =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const CAL =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';

function countdownText(inv: Invitation, today: Date): string {
  const n = daysUntil(inv.date, today);
  if (n === null) return '';
  const film = inv.kind === 'film';
  if (n > 1) return `Mai sunt ${roCount(n, 'zi', 'zile')}`;
  if (n === 1) return film ? 'Ne vedem mâine seară' : 'Mâine e ziua cea mare';
  if (n === 0) return film ? 'Ne vedem diseară' : 'Astăzi e ziua cea mare';
  return '';
}

/** A barcode for the ticket stub, its bars taken from the guest's name. */
function barcode(seed: number): string {
  let x = seed || 1;
  let at = 0;
  const bars: string[] = [];
  while (at < 96) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    const w = 1 + ((x >>> 16) % 3);
    if ((x >>> 20) % 3) bars.push(`<rect x="${at}" width="${w}" height="24"/>`);
    at += w + 1 + ((x >>> 24) % 2);
  }
  return `<svg class="tk-bar" viewBox="0 0 96 24" preserveAspectRatio="none" aria-hidden="true" fill="currentColor">${bars.join('')}</svg>`;
}

/**
 * The photo at the top. The host's own when they gave one; otherwise the kind's
 * own photograph, served next to the fonts, so nobody gets a drawing instead.
 * `wide` swaps to the landscape crop on landscape screens.
 */
export function stockPhoto(kind: Invitation['kind'], base: string, shape: 'p' | 'l'): string {
  return `${base}/img/bg/${kind}-${shape}.webp`;
}

function photoTag(inv: Invitation, o: RenderOpts, wide = false): string {
  const attrs = 'alt="" decoding="async" data-photo';
  if (inv.photo) return `<img src="${escHtml(inv.photo)}" ${attrs} referrerpolicy="no-referrer">`;
  const p = escHtml(stockPhoto(inv.kind, o.base, 'p'));
  if (!wide) return `<img src="${p}" ${attrs}>`;
  return `<picture><source media="(orientation:landscape)" srcset="${escHtml(stockPhoto(inv.kind, o.base, 'l'))}"><img src="${p}" ${attrs}></picture>`;
}

/** Film night: the invitation is a cinema ticket with the guest's name and seat. */
function ticketHero(inv: Invitation, o: RenderOpts): string {
  const first = inv.moments[0];
  const seat = seatFor(o.guest);
  const room = first?.place || inv.city || 'La noi acasă';
  const where = seat.row ? `Rândul ${seat.row}, locul ${seat.seat}` : 'Unde vrei tu';
  const cell = (k: string, v: string) => (v ? `<div><dt>${k}</dt><dd>${escHtml(v)}</dd></div>` : '');
  const guest = o.guest ? `<p class="h-guest rv" style="--i:0">Dragă ${escHtml(o.guest)},</p>` : '';
  const intro = inv.intro ? `<p class="h-intro rv" style="--i:2">${escHtml(inv.intro)}</p>` : '';
  const img = `<figure class="h-photo film-ph rv" style="--i:3" data-photo-box>${inv.photo ? photoTag(inv, o) : `<img src="${escHtml(stockPhoto('film', o.base, 'l'))}" alt="" decoding="async" data-photo>`}</figure>`;
  const count = countdownText(inv, o.today);
  return `<header class="hero hero-tk">${guest}
<div class="tk rv" style="--i:1">
<div class="tk-main"><p class="tk-kind">${escHtml(KIND_LABEL.film)} · Bilet de intrare</p>
<h1 class="tk-title">${escHtml(inv.title || 'Seara de film')}</h1>
${inv.hosts ? `<p class="tk-by">la ${escHtml(inv.hosts)}</p>` : ''}
<dl class="tk-grid">${cell('Data', inv.date ? `${dottedDate(inv.date)}` : '')}${cell('Ora', first?.time ?? '')}${cell('Sala', room)}${cell('Locul', where)}</dl></div>
<div class="tk-stub"><p class="tk-admit">Admite</p><p class="tk-name">${escHtml(o.guest || 'Un invitat drag')}</p>
${mainMotif('film', 'tk-reel')}${barcode(hashName(o.guest || inv.hosts))}<p class="tk-no">Nr. ${seat.no}</p></div>
</div>${intro}${img}
<p class="h-date rv" style="--i:4">${escHtml(longDate(inv.date))}</p>
<p class="h-count rv" style="--i:5" data-count>${escHtml(count)}</p>
</header>`;
}

function hero(inv: Invitation, t: Theme, o: RenderOpts): string {
  if (inv.kind === 'film') return ticketHero(inv, o);
  const label = escHtml(KIND_LABEL[inv.kind]);
  const hosts = escHtml(inv.hosts || 'Numele vostru');
  const date = escHtml(longDate(inv.date));
  const city = inv.city ? `<p class="h-city rv" style="--i:5">${escHtml(inv.city)}</p>` : '';
  const intro = inv.intro ? `<p class="h-intro rv" style="--i:1">${escHtml(inv.intro)}</p>` : '';
  const guest = o.guest
    ? `<p class="h-guest rv" style="--i:0">Dragă ${escHtml(o.guest)},</p>`
    : '';
  const count = countdownText(inv, o.today);
  const countEl = `<p class="h-count rv" style="--i:6" data-count>${escHtml(count)}</p>`;

  const motif = mainMotif(inv.kind, 'motif rv');
  const img = photoTag(inv, o, t.id === 'seara');

  if (t.id === 'seara') {
    const amp = escHtml(inv.hosts)
      .split(/\s*&amp;\s*/)
      .map((n) => `<span class="h-name">${n}</span>`)
      .join('<span class="h-amp">&amp;</span>');
    const nums = inv.date
      ? escHtml(dottedDate(inv.date)).split('.').map((x) => `<span>${x}</span>`).join('<i>·</i>')
      : '';
    return `<header class="hero${img ? ' has-photo' : ''}">
${img ? `<div class="h-bg" data-photo-box>${img}</div>` : ''}
<div class="h-in">${motif.replace('class="motif rv', 'style="--i:0" class="motif rv')}
${guest}<p class="h-kind rv" style="--i:1">${label}</p>
<h1 class="h-names rv" style="--i:2">${inv.hosts ? amp : hosts}</h1>
${intro}
${nums ? `<p class="h-nums rv" style="--i:3" aria-label="${date}">${nums}</p>` : ''}
<p class="h-date rv" style="--i:4">${date}</p>${city}${countEl}</div>
</header>`;
  }

  if (t.id === 'botanic') {
    return `<header class="hero">
<div class="h-text">${guest}<p class="h-kind rv" style="--i:1">${label}</p>
<h1 class="h-names rv" style="--i:2">${hosts}</h1>${intro}
<p class="h-date rv" style="--i:4">${date}</p>${city}${countEl}</div>
<div class="h-side${img ? ' has-photo' : ''}">${img ? `<figure class="h-photo rv" style="--i:2" data-photo-box>${img}</figure>` : ''}${motif}</div>
</header>`;
  }

  return `<header class="hero">
${motif.replace('class="motif rv', 'style="--i:0" class="motif rv')}
${img ? `<figure class="h-photo arch rv" style="--i:1" data-photo-box>${img}</figure>` : ''}
${guest}${intro}<p class="h-kind rv" style="--i:2">${label}</p>
<h1 class="h-names rv" style="--i:3">${hosts}</h1>
<div class="h-rule rv" style="--i:4" aria-hidden="true"></div>
<p class="h-date rv" style="--i:4">${date}</p>${city}${countEl}
</header>`;
}

function family(inv: Invitation): string {
  if (!inv.parents && !inv.godparents) return '';
  const col = (title: string, body: string) =>
    body ? `<div class="fam-col"><h3 class="lbl">${title}</h3>${prose(body)}</div>` : '';
  return `<section class="sec fam rv">${col('Părinții', inv.parents)}${col('Nașii', inv.godparents)}</section>`;
}

function program(inv: Invitation): string {
  if (!inv.moments.length) return '';
  const rows = inv.moments
    .map((m, i) => {
      const href = mapHref(m);
      const where = [m.place, m.address].filter(Boolean).map(escHtml);
      return `<li class="mo rv">
<span class="mo-n">${String(i + 1).padStart(2, '0')}</span>
<div class="mo-main"><h3 class="mo-title">${escHtml(m.title || m.place)}</h3>
${where.length ? `<p class="mo-where">${where.join('<br>')}</p>` : ''}
${href ? `<a class="mo-map" href="${escHtml(href)}" target="_blank" rel="noopener">${PIN}<span>Vezi pe hartă</span></a>` : ''}</div>
${m.time ? `<span class="mo-time">${escHtml(m.time)}</span>` : '<span class="mo-time"></span>'}
</li>`;
    })
    .join('');
  const title = inv.kind === 'film' ? 'Programul serii' : 'Programul zilei';
  return `<section class="sec prog"><h2 class="sec-title rv">${title}</h2><ol class="mos">${rows}</ol></section>`;
}

function rsvp(inv: Invitation, o: RenderOpts): string {
  const by = inv.rsvpBy ? `<p class="rs-by">Vă rugăm să ne răspundeți până pe ${escHtml(shortDate(inv.rsvpBy))}.</p>` : '';
  if (!waNumber(inv.rsvpPhone)) {
    return by ? `<section class="sec deep rs rv"><h2 class="sec-title">Confirmarea</h2>${by}</section>` : '';
  }
  const opts = (max: number, from: number) =>
    Array.from({ length: max - from + 1 }, (_, i) => `<option>${i + from}</option>`).join('');
  return `<section class="sec deep rs" id="confirmare">
<h2 class="sec-title rv">Ne confirmi prezența?</h2>${by}
<form class="rs-form rv" data-rsvp novalidate>
<fieldset class="rs-yn"><legend class="sr">Răspuns</legend>
<label><input type="radio" name="coming" value="da" checked><span>Da, venim</span></label>
<label><input type="radio" name="coming" value="nu"><span>Nu putem veni</span></label></fieldset>
<label class="rs-f"><span>Numele vostru</span><input name="name" maxlength="80" autocomplete="name" value="${escHtml(o.guest)}" required></label>
<div class="rs-row" data-when-coming>
<label class="rs-f"><span>Adulți</span><select name="adults">${opts(10, 1)}</select></label>
${inv.askKids ? `<label class="rs-f"><span>Copii</span><select name="kids">${opts(10, 0)}</select></label>` : ''}
${inv.askMenu ? `<label class="rs-f"><span>Meniu vegetarian</span><select name="veg">${opts(10, 0)}</select></label>` : ''}
</div>
<label class="rs-f"><span>Un gând pentru noi (opțional)</span><textarea name="message" rows="3" maxlength="500"></textarea></label>
<button class="rs-send" type="submit">Trimite confirmarea pe WhatsApp</button>
<p class="rs-hint">Se deschide WhatsApp cu mesajul gata scris. Tu doar apeși trimite.</p>
</form></section>`;
}

function envelope(inv: Invitation, t: Theme, o: RenderOpts): string {
  if (!o.envelope) return '';
  if (inv.kind === 'film') return curtain(o.guest) + stage(inv, t);
  return envelopeOnly(inv, t, o) + stage(inv, t);
}

function envelopeOnly(inv: Invitation, t: Theme, o: RenderOpts): string {
  const to = o.guest ? `Pentru ${escHtml(o.guest)}` : 'O invitație pentru tine';
  const bg = (shape: 'p' | 'l') => `url('${escHtml(inv.photo && shape === 'p' ? inv.photo : stockPhoto(inv.kind, o.base, shape))}')`;
  const land = inv.photo ? bg('p') : bg('l');
  return `<div class="env${t.id === 'seara' ? ' env-night' : ''}" data-env>
<div class="env-bg" style="--bp:${bg('p')};--bl:${land}" aria-hidden="true"></div>
<div class="env-flap" aria-hidden="true"></div>
<div class="env-body"><p class="env-to">${to}</p>
<button class="env-seal" type="button" data-open aria-label="Deschide invitația"><span>${escHtml(initials(inv.hosts) || '&')}</span></button>
<p class="env-hint">Atinge sigiliul ca să deschizi</p></div></div>`;
}

export function renderBody(inv: Invitation, o: RenderOpts): string {
  const t = THEMES[inv.template] ?? THEMES.clasic;
  const message = inv.message
    ? `<section class="sec deep msg rv">${smallMotif(inv.kind)}${prose(inv.message, 'msg-p')}</section>`
    : `<div class="orn-solo rv">${smallMotif(inv.kind)}</div>`;
  const note = inv.note ? `<section class="sec note rv"><h2 class="lbl">De știut</h2>${prose(inv.note)}</section>` : '';
  const snacks =
    inv.kind === 'film' && inv.snacks
      ? `<section class="sec snacks rv"><h2 class="lbl">La bufet</h2>${prose(inv.snacks, 'snacks-p')}</section>`
      : '';
  const cal = inv.date
    ? `<section class="sec cal rv"><p class="lbl">Ca să nu uitați</p><div class="cal-btns">
<a class="cal-b" data-gcal href="#" target="_blank" rel="noopener">${CAL}<span>Google Calendar</span></a>
<button class="cal-b" type="button" data-ics>${CAL}<span>Calendarul telefonului</span></button></div></section>`
    : '';
  // Shown by wire() once the music has started (it needs the opening tap).
  const tune =
    inv.music && o.envelope
      ? `<button class="mus" type="button" data-music hidden aria-pressed="false" aria-label="Pornește muzica"><span class="mus-eq" aria-hidden="true"><i></i><i></i><i></i></span><span>Muzică</span></button>`
      : '';
  return `${envelope(inv, t, o)}${tune}<main class="inv t-${t.id} k-${inv.kind}">
${hero(inv, t, o)}${message}${family(inv)}${program(inv)}${snacks}${note}${rsvp(inv, o)}${cal}
<footer class="badge"><a href="${escHtml(o.base)}/" target="_blank" rel="noopener">Invitație făcută gratuit cu <b>INVITLITE</b>. Fă-o și pe a ta</a></footer>
</main>`;
}

export function renderCss(inv: Invitation, o: RenderOpts): string {
  const t = THEMES[inv.template] ?? THEMES.clasic;
  return `${fontFaces(o.base)}
:root{--paper:${t.paper};--ink:${t.ink};--muted:${t.muted};--accent:${t.accent};--deep:${t.deep};--on-deep:${t.onDeep};--line:${t.line};
--display:${t.display};--body:'Jost Variable','Jost',system-ui,sans-serif;--pad:clamp(72px,12vw,144px);--gut:clamp(20px,6vw,64px)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.inv{overflow-x:hidden}
.sec{padding:var(--pad) var(--gut)}
.sec>*{max-width:760px;margin-left:auto;margin-right:auto}
.deep{background:var(--deep);color:var(--on-deep)}
.lbl{font-family:var(--body);font-size:.75rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin:0 0 14px}
.deep .lbl{color:inherit;opacity:.75}
.sec-title{font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,7vw,4.2rem);line-height:1;letter-spacing:-.02em;margin:0 auto 40px}

/* hero */
.hero{min-height:100svh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:var(--pad) var(--gut);position:relative}
.h-kind{font-size:.8rem;letter-spacing:.32em;text-transform:uppercase;color:var(--accent);margin:0 0 18px;font-weight:500}
.h-names{font-family:var(--display);font-weight:400;font-size:clamp(3.2rem,13vw,9rem);line-height:.95;letter-spacing:-.025em;margin:0;overflow-wrap:anywhere}
.h-intro{max-width:34ch;margin:0 auto 26px;color:var(--muted);font-size:1.05rem}
.h-guest{font-family:var(--display);font-style:italic;font-size:clamp(1.4rem,4vw,2rem);margin:0 0 22px}
.h-date{font-size:1.1rem;margin:26px 0 4px;letter-spacing:.02em}
.h-city{margin:0;color:var(--muted)}
.h-count{margin:34px 0 0;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.h-count:empty{display:none}

/* motifs: hand-drawn line art, drawn in once the invitation opens */
.motif{display:block;color:var(--accent);width:clamp(96px,22vw,150px);height:auto;margin:0 auto 30px}
.orn{display:block;color:currentColor;width:84px;height:auto;margin:0 auto 26px;opacity:.85}
.orn-solo{padding:calc(var(--pad)*.5) 0 0;color:var(--accent)}
.draw{stroke-dasharray:1;stroke-dashoffset:1}
.is-shown .hero .draw,.in .draw,.env .draw{animation:draw 2.6s .9s cubic-bezier(.6,0,.2,1) forwards}
.env .draw{animation-delay:.2s}
@keyframes draw{to{stroke-dashoffset:0}}

/* photo (hosted elsewhere; removed cleanly if it fails to load) */
.h-photo{margin:0 0 34px;overflow:hidden;background:var(--line)}
.h-photo img,.h-bg img{display:block;width:100%;height:100%;object-fit:cover}
.h-photo picture,.h-bg picture{display:contents}
/* the photo takes the drawing's place; if it fails to load, the drawing comes back */
.hero:has([data-photo-box]) .motif{display:none}
.is-shown .hero [data-photo-box] img{animation:kb 18s ease-out both}
@keyframes kb{from{transform:scale(1.12)}}

/* clasic */
.t-clasic .h-names{font-style:italic;font-weight:500}
.t-clasic .h-rule{width:min(240px,50vw);height:7px;border-top:1px solid var(--accent);border-bottom:1px solid var(--accent);margin:30px auto 0}
.t-clasic .arch{width:min(260px,62vw);aspect-ratio:3/4;border-radius:999px 999px 6px 6px;outline:1px solid var(--accent);outline-offset:7px}

/* botanic */
.t-botanic .hero{flex-direction:row;justify-content:space-between;text-align:left;gap:4vw;max-width:1180px;margin:0 auto}
.t-botanic .h-text{max-width:820px;min-width:0}
.t-botanic .h-names{font-size:clamp(3.6rem,14vw,10rem)}
.t-botanic .h-intro{margin-left:0}
.t-botanic .h-side{flex:0 0 auto;position:relative;width:clamp(120px,22vw,240px)}
.t-botanic .h-side .motif{width:100%;margin:0}
.t-botanic .h-side.has-photo{width:clamp(220px,32vw,400px)}
.t-botanic .h-side.has-photo .h-photo{margin:0;aspect-ratio:4/5;border-radius:4px}
.t-botanic .h-side.has-photo .motif{position:absolute;width:44%;left:-14%;bottom:-8%;background:var(--paper);border-radius:50%;padding:10%;box-sizing:content-box}
@media (max-width:640px){
  .t-botanic .hero{flex-direction:column-reverse;align-items:flex-start;justify-content:center;gap:34px}
  .t-botanic .h-side{width:110px}
  .t-botanic .h-side.has-photo{width:100%}
  .t-botanic .h-side.has-photo .h-photo{aspect-ratio:4/3}
  .t-botanic .h-side.has-photo .motif{width:96px;left:auto;right:12px;bottom:-30px;padding:12px}
}

/* seara */
.t-seara .hero{padding:0}
.t-seara .h-in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:var(--pad) var(--gut)}
.t-seara .h-bg{position:absolute;inset:0;z-index:0}
.t-seara .h-bg{overflow:hidden}
.t-seara .h-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,20,27,.3),rgba(18,20,27,.62) 50%,rgba(18,20,27,.8) 80%,var(--paper))}
.t-seara .has-photo .h-names{text-shadow:0 2px 24px rgba(0,0,0,.5)}
.t-seara .has-photo .h-kind,.t-seara .has-photo .h-amp,.t-seara .has-photo .h-nums i{color:var(--accent)}
.t-seara .has-photo .h-date,.t-seara .has-photo .h-city,.t-seara .has-photo .h-intro,.t-seara .has-photo .h-count{color:#D8CFBB}
.t-seara .h-names{display:flex;flex-direction:column;align-items:center;font-weight:400}
.t-seara .h-amp{font-style:italic;color:var(--accent);font-size:.6em;line-height:1.1}
.t-seara .h-nums{font-family:var(--display);font-size:clamp(2.6rem,10vw,6rem);line-height:1;margin:38px 0 0;display:flex;gap:.25em;align-items:baseline;font-variant-numeric:lining-nums}
.t-seara .h-nums i{font-style:normal;color:var(--accent)}
.t-seara .h-date{color:var(--muted);margin-top:14px}
.t-seara .h-intro{margin:30px auto 0}
.t-seara .motif{width:clamp(80px,16vw,120px)}

/* film night: the hero is a ticket */
.hero-tk .h-guest{margin-bottom:26px}
.tk{display:grid;grid-template-columns:1fr 34%;width:min(100%,680px);text-align:left;margin:0 0 34px;
background:color-mix(in srgb,var(--paper) 86%,var(--ink));color:var(--ink);
-webkit-mask:radial-gradient(circle at 66% 0,transparent 13px,#000 13.5px) top/100% 51% no-repeat,radial-gradient(circle at 66% 100%,transparent 13px,#000 13.5px) bottom/100% 51% no-repeat;
mask:radial-gradient(circle at 66% 0,transparent 13px,#000 13.5px) top/100% 51% no-repeat,radial-gradient(circle at 66% 100%,transparent 13px,#000 13.5px) bottom/100% 51% no-repeat}
.tk.rv{transform:translateY(46px) rotate(-5deg) scale(.92);transition-duration:1.2s}
.tk-main{padding:clamp(18px,4vw,34px);min-width:0}
.tk-kind{font-size:.66rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);margin:0 0 12px}
.tk-title{font-family:var(--display);font-weight:400;font-size:clamp(1.7rem,6.4vw,3.4rem);line-height:1;letter-spacing:-.02em;margin:0;overflow-wrap:anywhere}
.tk-by{margin:8px 0 0;color:var(--muted);font-style:italic;font-family:var(--display);font-size:1.15rem}
.tk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:14px 18px;margin:22px 0 0;padding-top:16px;border-top:1px solid var(--line)}
.tk-grid dt{font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tk-grid dd{margin:2px 0 0;font-size:.98rem;font-weight:500;line-height:1.25}
.tk-stub{background:var(--deep);color:var(--on-deep);padding:clamp(16px,3vw,26px) 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;min-width:0;border-left:2px dashed color-mix(in srgb,var(--on-deep) 45%,transparent)}
.tk-admit{font-size:.62rem;letter-spacing:.3em;text-transform:uppercase;margin:0;opacity:.8}
.tk-name{font-family:var(--display);font-size:clamp(1.15rem,4.4vw,1.7rem);line-height:1.1;margin:0;overflow-wrap:anywhere}
.tk-reel{width:54px;height:auto;margin:6px 0}
.tk-bar{width:100%;max-width:120px;height:26px}
.tk-no{font-size:.68rem;letter-spacing:.18em;margin:0;opacity:.8;font-variant-numeric:tabular-nums}
.film-ph{width:min(100%,680px);aspect-ratio:16/9;margin:0 0 30px}
.hero-tk .h-intro{margin-bottom:16px}
.hero-tk .h-date{margin-top:0}
.snacks{text-align:center}
.snacks-p{font-family:var(--display);font-size:clamp(1.4rem,4vw,2.1rem);line-height:1.3;margin:0 auto;max-width:30ch}

/* message */
.msg{text-align:center}
.msg-p{font-family:var(--display);font-size:clamp(1.5rem,4.4vw,2.5rem);line-height:1.3;margin:0 auto 18px;max-width:28ch;font-style:italic}
.t-seara .msg-p{font-style:normal}

/* family */
.fam{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:40px;max-width:900px;margin:0 auto;text-align:center}
.fam-col p{font-family:var(--display);font-size:clamp(1.4rem,3.6vw,1.9rem);line-height:1.25;margin:0}

/* program */
.mos{list-style:none;margin:0 auto;padding:0;border-top:1px solid var(--line)}
.mo{display:grid;grid-template-columns:3.2rem 1fr auto;gap:18px;align-items:start;padding:28px 0;border-bottom:1px solid var(--line)}
.mo-n{font-size:.8rem;letter-spacing:.14em;color:var(--accent);padding-top:.7em;font-variant-numeric:tabular-nums}
.mo-title{font-family:var(--display);font-weight:400;font-size:clamp(1.7rem,5vw,2.6rem);line-height:1.05;margin:0 0 8px}
.mo-where{margin:0 0 12px;color:var(--muted)}
.mo-time{font-family:var(--display);font-size:clamp(1.6rem,4.6vw,2.4rem);line-height:1;font-variant-numeric:lining-nums;padding-top:.1em}
.mo-map{display:inline-flex;align-items:center;gap:7px;font-size:.9rem;text-decoration:none;border-bottom:1px solid var(--accent);padding-bottom:2px}
.mo-map:hover{color:var(--accent)}
@media (max-width:520px){.mo{grid-template-columns:2.2rem 1fr;}.mo-time{grid-column:2;grid-row:1;justify-self:start;font-size:1.3rem;color:var(--accent)}.mo-main{grid-column:2}}

/* note */
.note p{margin:0 auto 10px;font-size:1.05rem}

/* rsvp */
.rs .sec-title{text-align:center}
.rs-by{text-align:center;margin:-20px auto 36px;opacity:.85}
.rs-form{max-width:520px;display:grid;gap:18px}
.rs-yn{border:0;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rs-yn label{position:relative}
.rs-yn input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.rs-yn span{display:block;text-align:center;padding:14px 10px;border:1px solid currentColor;font-weight:500;cursor:pointer}
.rs-yn input:checked+span{background:var(--on-deep);color:var(--deep)}
.rs-yn input:focus-visible+span{outline:2px solid var(--on-deep);outline-offset:3px}
.rs-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px}
.rs-f{display:grid;gap:6px;font-size:.85rem;letter-spacing:.04em}
.rs-f input,.rs-f select,.rs-f textarea{font:inherit;font-size:1rem;letter-spacing:0;color:var(--on-deep);background:transparent;border:0;border-bottom:1px solid currentColor;padding:10px 2px;border-radius:0;width:100%}
.rs-f select option{color:#111}
.rs-f textarea{resize:vertical;border:1px solid currentColor;padding:10px}
.rs-f input:focus,.rs-f select:focus,.rs-f textarea:focus{outline:2px solid var(--on-deep);outline-offset:2px}
.rs-send{font:inherit;font-weight:500;font-size:1.05rem;background:var(--on-deep);color:var(--deep);border:0;padding:18px 20px;cursor:pointer;margin-top:6px}
.rs-send:hover{opacity:.9}
.rs-hint{font-size:.85rem;opacity:.75;margin:0;text-align:center}
.is-not-coming [data-when-coming]{display:none}

/* calendar */
.cal{text-align:center;padding-top:calc(var(--pad)*.6);padding-bottom:calc(var(--pad)*.6)}
.cal-btns{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.cal-b{font:inherit;font-size:.95rem;display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border:1px solid var(--line);background:transparent;color:var(--ink);text-decoration:none;cursor:pointer}
.cal-b:hover{border-color:var(--accent);color:var(--accent)}

.badge{text-align:center;padding:28px var(--gut) 40px;font-size:.78rem;color:var(--muted)}
.badge a{text-decoration:none;border-bottom:1px solid var(--line)}

/* envelope */
.env{position:fixed;inset:0;z-index:10;background:var(--deep);color:var(--on-deep);display:grid;place-items:center;perspective:1400px;transition:transform 1s .55s cubic-bezier(.7,0,.2,1)}
.env-bg{position:absolute;inset:0;overflow:hidden;background:var(--deep)}
.env-bg::before{content:'';position:absolute;inset:-2%;background:var(--bp) center/cover no-repeat;animation:kb 16s ease-out both}
@media (orientation:landscape){.env-bg::before{background-image:var(--bl)}}
.env-bg::after{content:'';position:absolute;inset:0;background:color-mix(in srgb,var(--deep) 70%,transparent)}
.env-flap{position:absolute;left:0;right:0;top:0;height:52%;background:color-mix(in srgb,var(--deep) 86%,transparent);filter:brightness(.88);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .8s cubic-bezier(.6,0,.2,1)}
.env-body{position:relative;text-align:center;padding:0 24px}
.env-motif{display:block;width:110px;height:auto;margin:0 auto 26px;color:var(--on-deep);opacity:.9}
.env-to{font-family:var(--display);font-size:clamp(1.8rem,7vw,3rem);margin:0 0 36px;font-style:italic;text-shadow:0 2px 18px rgba(0,0,0,.35)}
.env-seal{width:96px;height:96px;border-radius:50%;border:0;cursor:pointer;background:var(--on-deep);color:var(--deep);font-family:var(--display);font-size:1.7rem;letter-spacing:.06em;box-shadow:0 0 0 6px color-mix(in srgb,var(--on-deep) 30%,transparent);animation:pulse 2.4s ease-in-out infinite}
.env-seal:focus-visible{outline:2px solid var(--on-deep);outline-offset:8px}
.env-hint{margin:26px 0 0;font-size:.8rem;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.env-night{background:var(--paper);color:var(--ink)}
.env-night .env-bg::after{background:color-mix(in srgb,var(--paper) 74%,transparent)}
.env-night .env-flap{background:color-mix(in srgb,var(--paper) 86%,transparent)}
.env-night .env-seal{background:var(--accent);color:var(--paper);box-shadow:0 0 0 6px color-mix(in srgb,var(--accent) 30%,transparent);animation-name:pulse-n}
@keyframes pulse-n{50%{box-shadow:0 0 0 14px color-mix(in srgb,var(--accent) 12%,transparent)}}
@keyframes pulse{50%{box-shadow:0 0 0 14px color-mix(in srgb,var(--on-deep) 12%,transparent)}}
.is-open .env-flap{transform:rotateX(180deg)}
.is-open .env{transform:translateY(-105%)}
.is-sealed body{overflow:hidden}

/* reveals: hero staggers once the envelope opens, the rest on scroll */
.rv{opacity:0;transform:translateY(22px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.is-shown .hero .rv{opacity:1;transform:none;transition-delay:calc(.9s + var(--i,0)*.12s)}
.rv.in{opacity:1;transform:none}
.no-env .hero .rv{transition-delay:calc(var(--i,0)*.08s)}
.is-shown.post .hero .rv{transition-delay:calc(.15s + var(--i,0)*.12s)}
@media (prefers-reduced-motion:reduce){
  .rv{opacity:1;transform:none;transition:none}
  .env,.env-flap{transition:opacity .3s}
  .is-open .env{transform:none;opacity:0;pointer-events:none}
  .env-seal,.env-bg::before,.hero [data-photo-box] img{animation:none!important}
  .draw{stroke-dashoffset:0;animation:none}
}
${sceneCss()}
/* background music switch */
.mus{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:8;display:flex;align-items:center;gap:9px;padding:10px 14px 10px 12px;
font:inherit;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:999px;cursor:pointer;box-shadow:0 6px 18px -10px rgba(0,0,0,.35)}
.mus[hidden]{display:none}
.mus:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.mus-eq{display:flex;align-items:flex-end;gap:2px;height:12px}
.mus-eq i{width:3px;height:100%;background:var(--accent);transform-origin:50% 100%;transform:scaleY(.3)}
.mus[aria-pressed=true] .mus-eq i{animation:eq .9s ease-in-out infinite alternate}
.mus-eq i:nth-child(2){animation-delay:-.3s!important}
.mus-eq i:nth-child(3){animation-delay:-.6s!important}
@keyframes eq{0%{transform:scaleY(.3)}100%{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.mus[aria-pressed=true] .mus-eq i{animation:none;transform:scaleY(.8)}}
@media print{.mus,.env,.cur,.st,.petals,.rs-form,.cal,.badge{display:none}.rv{opacity:1;transform:none}.hero{min-height:auto}}`;
}

export function renderDocument(inv: Invitation, o: RenderOpts): string {
  const title = escHtml([KIND_LABEL[inv.kind], inv.hosts].filter(Boolean).join(' ') || 'Invitație');
  return `<!doctype html><html lang="ro" class="${o.envelope ? 'is-sealed' : 'is-open is-shown no-env'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title}</title><style>${renderCss(inv, o)}</style></head><body>${renderBody(inv, o)}</body></html>`;
}

export function documentTitle(inv: Invitation): string {
  return [KIND_LABEL[inv.kind], inv.hosts].filter(Boolean).join(' ') || 'Invitație';
}
