import { daysUntil, dottedDate, initials, KIND_LABEL, longDate, roCount, shortDate } from './format';
import { escHtml, safeHref } from './sanitize';
import { fontFaces, THEMES, type Theme } from './theme';
import { waNumber } from './rsvp';
import { mainMotif, smallMotif } from './motifs';
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

function countdownText(iso: string, today: Date): string {
  const n = daysUntil(iso, today);
  if (n === null) return '';
  if (n > 1) return `Mai sunt ${roCount(n, 'zi', 'zile')}`;
  if (n === 1) return 'Mâine e ziua cea mare';
  if (n === 0) return 'Astăzi e ziua cea mare';
  return '';
}

function hero(inv: Invitation, t: Theme, o: RenderOpts): string {
  const label = escHtml(KIND_LABEL[inv.kind]);
  const hosts = escHtml(inv.hosts || 'Numele vostru');
  const date = escHtml(longDate(inv.date));
  const city = inv.city ? `<p class="h-city rv" style="--i:5">${escHtml(inv.city)}</p>` : '';
  const intro = inv.intro ? `<p class="h-intro rv" style="--i:1">${escHtml(inv.intro)}</p>` : '';
  const guest = o.guest
    ? `<p class="h-guest rv" style="--i:0">Dragă ${escHtml(o.guest)},</p>`
    : '';
  const count = countdownText(inv.date, o.today);
  const countEl = `<p class="h-count rv" style="--i:6" data-count>${escHtml(count)}</p>`;

  const motif = mainMotif(inv.kind, 'motif rv');
  const img = inv.photo
    ? `<img src="${escHtml(inv.photo)}" alt="" referrerpolicy="no-referrer" decoding="async" data-photo>`
    : '';

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
  return `<section class="sec prog"><h2 class="sec-title rv">Programul zilei</h2><ol class="mos">${rows}</ol></section>`;
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

function envelope(inv: Invitation, o: RenderOpts): string {
  if (!o.envelope) return '';
  const to = o.guest ? `Pentru ${escHtml(o.guest)}` : 'O invitație pentru tine';
  return `<div class="env" data-env>
<div class="env-flap" aria-hidden="true"></div>
<div class="env-body">${mainMotif(inv.kind, 'env-motif')}<p class="env-to">${to}</p>
<button class="env-seal" type="button" data-open aria-label="Deschide invitația"><span>${escHtml(initials(inv.hosts) || '&')}</span></button>
<p class="env-hint">Atinge sigiliul ca să deschizi</p></div></div>`;
}

export function renderBody(inv: Invitation, o: RenderOpts): string {
  const t = THEMES[inv.template] ?? THEMES.clasic;
  const message = inv.message
    ? `<section class="sec deep msg rv">${smallMotif(inv.kind)}${prose(inv.message, 'msg-p')}</section>`
    : `<div class="orn-solo rv">${smallMotif(inv.kind)}</div>`;
  const note = inv.note ? `<section class="sec note rv"><h2 class="lbl">De știut</h2>${prose(inv.note)}</section>` : '';
  const cal = inv.date
    ? `<section class="sec cal rv"><p class="lbl">Ca să nu uitați</p><div class="cal-btns">
<a class="cal-b" data-gcal href="#" target="_blank" rel="noopener">${CAL}<span>Google Calendar</span></a>
<button class="cal-b" type="button" data-ics>${CAL}<span>Calendarul telefonului</span></button></div></section>`
    : '';
  return `${envelope(inv, o)}<main class="inv t-${t.id}">
${hero(inv, t, o)}${message}${family(inv)}${program(inv)}${note}${rsvp(inv, o)}${cal}
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
.is-open .hero .draw,.in .draw,.env .draw{animation:draw 2.6s .9s cubic-bezier(.6,0,.2,1) forwards}
.env .draw{animation-delay:.2s}
@keyframes draw{to{stroke-dashoffset:0}}

/* photo (hosted elsewhere; removed cleanly if it fails to load) */
.h-photo{margin:0 0 34px;overflow:hidden;background:var(--line)}
.h-photo img,.h-bg img{display:block;width:100%;height:100%;object-fit:cover}

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
.t-seara .h-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,20,27,.55),rgba(18,20,27,.82) 55%,var(--paper))}
.t-seara .has-photo .h-kind,.t-seara .has-photo .h-amp,.t-seara .has-photo .h-nums i{color:var(--accent)}
.t-seara .has-photo .h-date,.t-seara .has-photo .h-city,.t-seara .has-photo .h-intro,.t-seara .has-photo .h-count{color:#D8CFBB}
.t-seara .h-names{display:flex;flex-direction:column;align-items:center;font-weight:400}
.t-seara .h-amp{font-style:italic;color:var(--accent);font-size:.6em;line-height:1.1}
.t-seara .h-nums{font-family:var(--display);font-size:clamp(2.6rem,10vw,6rem);line-height:1;margin:38px 0 0;display:flex;gap:.25em;align-items:baseline;font-variant-numeric:lining-nums}
.t-seara .h-nums i{font-style:normal;color:var(--accent)}
.t-seara .h-date{color:var(--muted);margin-top:14px}
.t-seara .h-intro{margin:30px auto 0}
.t-seara .motif{width:clamp(80px,16vw,120px)}

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
.env-flap{position:absolute;left:0;right:0;top:0;height:52%;background:var(--deep);filter:brightness(.88);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .8s cubic-bezier(.6,0,.2,1)}
.env-body{position:relative;text-align:center;padding:0 24px}
.env-motif{display:block;width:110px;height:auto;margin:0 auto 26px;color:var(--on-deep);opacity:.9}
.env-to{font-family:var(--display);font-size:clamp(1.6rem,6vw,2.6rem);margin:0 0 36px;font-style:italic}
.env-seal{width:96px;height:96px;border-radius:50%;border:0;cursor:pointer;background:var(--on-deep);color:var(--deep);font-family:var(--display);font-size:1.7rem;letter-spacing:.06em;box-shadow:0 0 0 6px color-mix(in srgb,var(--on-deep) 30%,transparent);animation:pulse 2.4s ease-in-out infinite}
.env-seal:focus-visible{outline:2px solid var(--on-deep);outline-offset:8px}
.env-hint{margin:26px 0 0;font-size:.8rem;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
@keyframes pulse{50%{box-shadow:0 0 0 14px color-mix(in srgb,var(--on-deep) 12%,transparent)}}
.is-open .env-flap{transform:rotateX(180deg)}
.is-open .env{transform:translateY(-105%)}
.is-sealed body{overflow:hidden}

/* reveals: hero staggers once the envelope opens, the rest on scroll */
.rv{opacity:0;transform:translateY(22px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.is-open .hero .rv{opacity:1;transform:none;transition-delay:calc(.9s + var(--i,0)*.12s)}
.rv.in{opacity:1;transform:none}
.no-env .hero .rv{transition-delay:calc(var(--i,0)*.08s)}
@media (prefers-reduced-motion:reduce){
  .rv{opacity:1;transform:none;transition:none}
  .env,.env-flap{transition:opacity .3s}
  .is-open .env{transform:none;opacity:0;pointer-events:none}
  .env-seal{animation:none}
  .draw{stroke-dashoffset:0;animation:none}
}
@media print{.env,.rs-form,.cal,.badge{display:none}.rv{opacity:1;transform:none}.hero{min-height:auto}}`;
}

export function renderDocument(inv: Invitation, o: RenderOpts): string {
  const title = escHtml([KIND_LABEL[inv.kind], inv.hosts].filter(Boolean).join(' ') || 'Invitație');
  return `<!doctype html><html lang="ro" class="${o.envelope ? 'is-sealed' : 'is-open no-env'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title}</title><style>${renderCss(inv, o)}</style></head><body>${renderBody(inv, o)}</body></html>`;
}

export function documentTitle(inv: Invitation): string {
  return [KIND_LABEL[inv.kind], inv.hosts].filter(Boolean).join(' ') || 'Invitație';
}
