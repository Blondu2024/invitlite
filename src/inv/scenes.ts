import { dottedDate, KIND_LABEL, longDate } from './format';
import { mainMotif } from './motifs';
import { escHtml } from './sanitize';
import { KINDS, sceneOf, type SceneKind } from './kinds';
import type { Theme } from './theme';
import type { Invitation } from './types';

/**
 * Entrance scenes. Each one is a full-screen layer that plays once, after the
 * guest opens the invitation, then dissolves into the page underneath. All of
 * it lives in the site code: nothing here adds a byte to the link.
 *   nunta      - the envelope opens, a veil lifts, petals fall, the couple is
 *                drawn in gold line, two rings meet and spark, the names arrive;
 *   botez      - warm light through a stained-glass window, a dove crosses the
 *                screen and leaves the child's name behind it;
 *   cununie    - the two names are written into the register with a pen, then
 *                a stamp comes down: DA;
 *   aniversare - confetti on opening, a cake whose candles the guest blows out
 *                by touching them;
 *   copii      - balloons float up; popping them reveals when and where;
 *   film       - a velvet curtain parts on an old cinema countdown, 3 2 1, and
 *                the invitation lands as a ticket.
 * The other kinds borrow one of these six (kinds.ts says which), with their
 * own labels and closing words.
 * Line art is drawn by hand for this project.
 *
 * What wire() reads from a stage:
 *   data-stage  - the longest it may run, in ms (then the page shows anyway);
 *   data-cues   - sounds on a timeline, "name@ms,name@ms";
 *   data-tap    - things the guest touches; data-sfx is the sound each makes;
 *   data-done   - the sound once every data-tap is touched;
 *   data-after  - how long to linger after that, in ms;
 *   data-auto   - when to finish the taps for a guest who only watches.
 */

/** The longest each scene runs from the tap, in ms. */
export const SCENE_MS: Record<SceneKind, number> = {
  nunta: 7800,
  botez: 7000,
  cununie: 6600,
  aniversare: 30000,
  copii: 30000,
  film: 3900,
};

/** Guests who only watch get the taps done for them after this long. */
export const AUTO_MS = 11000;

const CONFETTI = '#E4572E,#F3A712,#3E8ED0,#7BB661,#E58FB0,#F6E27F';

const GOLD: Record<Theme['id'], string> = { clasic: '#B08A48', botanic: '#A57A2E', seara: '#D9BE86' };

/** Petal colours per style, read by the canvas through data-petals. */
const PETALS: Record<Theme['id'], string> = {
  clasic: '#E8C6C0,#F2DFD8,#C9908B',
  botanic: '#F4F1E6,#DCE3CF,#E6D6B0',
  seara: '#D9BE86,#EDE3CC,#B89A62',
};

const p = (d: string) => `<path class="sd" pathLength="1" d="${d}"/>`;
const c = (cx: number, cy: number, r: number) => `<circle class="sd" pathLength="1" cx="${cx}" cy="${cy}" r="${r}"/>`;

/** Groom on the left, bride with veil and bouquet on the right, hands joined. */
const COUPLE =
  // groom
  c(72, 38, 13) +
  p('M59.5 36c1-9 6-14 13-14s12 4 12.5 11') +
  p('M67 50.5l-1 6.5 M77 50.5l1 6.5') +
  p('M66 57L54 62 56 150H88L90 62 78 57') +
  p('M66 57l6 26 6-26 M68 59.5l4 2.5-4 2.5z M76 59.5l-4 2.5 4 2.5z') +
  p('M54 63c-7 9-8 38-5 68 M90 64c8 11 10 32 11 52') +
  p('M58 150l2 56 M86 150l-2 56 M72 158v48') +
  // bride
  c(128, 40, 12) + c(139, 30, 5) +
  p('M136 27c18 8 34 52 40 128-8-8-18-10-27-4') +
  p('M128 52v7 M118 61c4-2 16-2 20 0l-4 37h-12z') +
  p('M122 98c-7 40-17 78-26 108 26 8 52 8 76 0-11-30-22-68-38-108') +
  p('M118 62c-8 14-12 34-15 54 M138 62c6 13 4 32-8 44') +
  c(127, 110, 6) + c(120, 105, 4) + c(134, 104, 4) +
  p('M127 116l-3 14 M127 116l3 14') +
  // joined hands, the ground
  c(102, 118, 3.5) +
  p('M40 210h130');

const RINGS = `<svg class="st-rings" viewBox="0 0 160 76" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
<g class="ring-l"><circle cx="52" cy="42" r="20"/><circle cx="52" cy="42" r="16.5" stroke-width="1"/></g>
<g class="ring-r"><circle cx="108" cy="42" r="20"/><circle cx="108" cy="42" r="16.5" stroke-width="1"/><path d="M104 22l4-6 4 6z" stroke-width="1.2"/></g>
<g class="spark" stroke-width="1.4"><path d="M80 9v-7 M80 37v7 M66 23h-7 M94 23h7 M70 13l-4-4 M90 13l4-4 M70 33l-4 4 M90 33l4 4"/><path d="M80 17l2 6-2 6-2-6z" fill="currentColor"/></g>
</svg>`;

const SKIP = '<button class="st-skip" type="button" data-skip>Sari peste</button>';

/** Mute button. wire() removes it where the browser has no Web Audio. */
const SND = `<button class="st-snd" type="button" data-snd aria-pressed="false" aria-label="Fără sunet">
<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="snd-on" d="M15.5 9a4.2 4.2 0 0 1 0 6 M18 6.5a7.8 7.8 0 0 1 0 11"/><path class="snd-off" d="M16 9.5l5 5 M21 9.5l-5 5"/></svg></button>`;

const cues = (...c: string[]) => `data-cues="${c.join(',')}"`;

function wedding(inv: Invitation, t: Theme): string {
  const names = inv.hosts
    ? escHtml(inv.hosts).replace(/\s*&amp;\s*/, '<i> &amp; </i>')
    : escHtml(KIND_LABEL[inv.kind]);
  return `<div class="st st-wed" data-stage="${SCENE_MS.nunta}" ${cues('whoosh@0', 'whoosh@1300', 'chime@5650', 'sparkle@6000')} style="--gold:${GOLD[t.id]}">
<div class="st-veil" aria-hidden="true"></div>
<div class="st-in" aria-hidden="true">
<svg class="st-couple" viewBox="0 0 200 220" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${COUPLE}</svg>
${RINGS}
<p class="st-names">${names}</p></div>${SND}${SKIP}</div>
<canvas class="petals" data-petals="${PETALS[t.id]}" aria-hidden="true"></canvas>`;
}

/** A gothic window, glass in four warm colours, a rose at the top. */
const WINDOW = `<svg class="st-win" viewBox="0 0 120 180" aria-hidden="true">
<defs><clipPath id="st-win-c"><path d="M10 176V70C10 32 32 10 60 4c28 6 50 28 50 66v106z"/></clipPath></defs>
<g clip-path="url(#st-win-c)" opacity=".85"><rect width="60" height="70" fill="#8FB8D8"/><rect x="60" width="60" height="70" fill="#D98C8C"/>
<rect y="70" width="60" height="50" fill="#E8B85C"/><rect x="60" y="70" width="60" height="50" fill="#A9C08A"/>
<rect y="120" width="60" height="60" fill="#D98C8C"/><rect x="60" y="120" width="60" height="60" fill="#8FB8D8"/>
<circle cx="60" cy="46" r="20" fill="#F2CF7A"/></g>
<g fill="none" stroke="#3A2E22" stroke-width="2.4" stroke-linejoin="round"><path d="M10 176V70C10 32 32 10 60 4c28 6 50 28 50 66v106z"/>
<path d="M60 4v22 M60 66v110 M10 70h30 M80 70h30 M10 120h100 M10 150h100 M35 120v56 M85 120v56"/>
<circle cx="60" cy="46" r="20"/><path d="M60 26v40 M40 46h40 M46 32l28 28 M74 32L46 60"/></g></svg>`;

function baptism(inv: Invitation): string {
  return `<div class="st st-bap" data-stage="${SCENE_MS.botez}" ${cues('whoosh@0', 'bell@700', 'flutter@2300', 'flutter@3400', 'sparkle@4600')}>
<div class="st-rays" aria-hidden="true"><i></i><i></i><i></i></div>${WINDOW}
<p class="st-blbl" aria-hidden="true">${escHtml(KIND_LABEL[inv.kind])}</p>
<p class="st-bname" aria-hidden="true">${escHtml(inv.hosts || (inv.kind === 'botez' ? 'Botezul nostru' : 'Vă așteptăm'))}</p>
${mainMotif('botez', 'st-dove')}${SND}${SKIP}</div>`;
}

/** The two names, however the host wrote them: "Ana & Mihai", "Ana și Mihai". */
export function splitNames(hosts: string): string[] {
  return hosts
    .split(/\s*[&+]\s*|\s+(?:și|si)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
}

const PEN =
  '<svg class="civ-pen" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 37l5-15L30 2l8 8-20 22z M3 37l9-9 M23 9l8 8"/></svg>';

function civil(inv: Invitation): string {
  const names = splitNames(inv.hosts);
  const d = KINDS[inv.kind];
  if (!names.length) names.push(inv.kind === 'cununie' ? 'Noi doi' : d.label);
  const line = (n: string, k: number) =>
    `<div class="civ-row"><span class="civ-line" style="--k:${k}"><span class="civ-name">${escHtml(n)}</span>${PEN}</span></div>`;
  const rows = names.map(line).join(names.length > 1 ? '<p class="civ-and">și</p>' : '');
  const ring = `${d.ring ?? d.label.toLocaleUpperCase('ro')} · ${dottedDate(inv.date) || 'ZIUA NOASTRĂ'} ·`;
  const word = d.stamp ?? 'DA';
  const scratches = names.map((_, k) => `scratch@${1500 + k * 1500}`);
  return `<div class="st st-civ" data-stage="${SCENE_MS.cununie}" ${cues('whoosh@0', ...scratches, 'stamp@4450', 'chime@4950')}>
<div class="civ-sheet" aria-hidden="true"><p class="civ-head">${escHtml(d.label)}</p>${rows}
<svg class="civ-stamp" viewBox="0 0 120 120"><defs><path id="civ-p" d="M18 60a42 42 0 1 1 84 0a42 42 0 1 1-84 0"/></defs>
<circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text font-size="10" font-weight="600" fill="currentColor"><textPath href="#civ-p" textLength="258" lengthAdjust="spacing">${escHtml(ring)}</textPath></text>
<text x="60" y="${word.length > 3 ? 64 : 71}" text-anchor="middle" font-size="${word.length > 3 ? 12 : 30}" font-weight="700" fill="currentColor">${escHtml(word)}</text></svg></div>${SND}${SKIP}</div>`;
}

/** A cake drawn in flat colour; the candles are buttons laid over its top tier. */
const CAKE = `<svg class="bd-svg" viewBox="0 0 240 200" aria-hidden="true">
<ellipse cx="120" cy="186" rx="112" ry="10" fill="#000" opacity=".12"/>
<path d="M14 182h212" stroke="#C9B9A6" stroke-width="5" stroke-linecap="round"/>
<rect x="30" y="120" width="180" height="62" rx="8" fill="#F6E3C8"/>
<path d="M30 132c0-8 4-12 12-12h156c8 0 12 4 12 12v6c-8 0-8 12-16 12s-8-12-16-12-8 16-16 16-8-16-16-16-8 12-16 12-8-12-16-12-8 18-16 18-8-18-16-18-8 12-16 12-8-12-16-12-8 14-16 14-8-14-16-14-8 10-14 10z" fill="#E79AA6"/>
<rect x="60" y="68" width="120" height="54" rx="7" fill="#FBEEDC"/>
<path d="M60 78c0-6 3-10 9-10h102c6 0 9 4 9 10v4c-6 0-6 10-12 10s-6-10-12-10-6 12-12 12-6-12-12-12-6 9-12 9-6-9-12-9-6 12-12 12-6-12-12-12-6 8-12 8-6-8-9-8z" fill="#9CC9C1"/>
<g fill="#fff" opacity=".8"><circle cx="52" cy="166" r="2.5"/><circle cx="96" cy="160" r="2.5"/><circle cx="140" cy="168" r="2.5"/><circle cx="186" cy="162" r="2.5"/><circle cx="84" cy="108" r="2"/><circle cx="122" cy="112" r="2"/><circle cx="160" cy="106" r="2"/></g></svg>`;

function birthday(inv: Invitation): string {
  const age = Number(/\b(\d{1,3})\b/.exec(inv.hosts)?.[1] ?? 0);
  const n = age >= 1 && age <= 5 ? age : 3;
  const candles = Array.from({ length: n }, (_, i) => {
    const left = 50 + (i - (n - 1) / 2) * 10.5;
    return `<button class="bd-c" type="button" data-tap data-sfx="puff" style="left:${left}%;--k:${i}" aria-label="Stinge lumânarea ${i + 1}"><i class="bd-stick"></i><i class="bd-flame"></i><i class="bd-smoke"></i></button>`;
  }).join('');
  return `<div class="st st-bd" data-stage="${SCENE_MS.aniversare}" data-auto="${AUTO_MS}" data-after="2600" data-done="horn" ${cues('popper@150', 'sparkle@900')}>
<div class="bd-in">${age ? `<p class="bd-age" aria-hidden="true">${age}</p>` : ''}
<p class="bd-hint">Pune-ți o dorință și stinge lumânările</p>
<div class="bd-cake">${CAKE}${candles}</div>
<p class="bd-wish" aria-live="polite">${escHtml(KINDS[inv.kind].wish ?? 'La mulți ani!')}</p>
<p class="bd-who">${escHtml(inv.hosts)}</p></div>${SND}${SKIP}</div>
<canvas class="petals" data-petals="${CONFETTI}" data-shape="confetti" data-at="100" aria-hidden="true"></canvas>`;
}

const BALLOON_COLORS = ['#E4572E', '#F3A712', '#3E8ED0'];

function kids(inv: Invitation): string {
  const first = inv.moments[0];
  const cards: [string, string][] = [
    ['Când', longDate(inv.date).replace(/ \d{4}$/, '') || 'În curând'],
    ['La ora', first?.time || 'Vă anunțăm'],
    ['Unde', first?.place || inv.city || 'La noi'],
  ];
  const slots = cards
    .map(
      ([k, v], i) => `<div class="kb-slot" style="--k:${i};--c:${BALLOON_COLORS[i]}">
<button class="kb" type="button" data-tap data-sfx="pop" aria-label="Sparge balonul ${i + 1}"><svg viewBox="0 0 60 100" aria-hidden="true"><path d="M30 4C46 4 56 18 56 34c0 20-14 36-26 38C18 70 4 54 4 34 4 18 14 4 30 4z" fill="currentColor"/><ellipse cx="19" cy="22" rx="5" ry="9" fill="#fff" opacity=".35" transform="rotate(-20 19 22)"/><path d="M26 77l4-5 4 5z" fill="currentColor"/><path d="M30 77c-6 8 6 12 0 22" fill="none" stroke="#7a6a5a" stroke-width="1.2"/></svg></button>
<p class="kc"><span>${k}</span><b>${escHtml(v)}</b></p></div>`,
    )
    .join('');
  return `<div class="st st-kid" data-stage="${SCENE_MS.copii}" data-auto="${AUTO_MS}" data-after="2800" data-done="horn" ${cues('whoosh@0', 'sparkle@800')}>
<div class="kd-in"><p class="kd-lbl">${escHtml(KIND_LABEL[inv.kind])}</p><p class="kd-who">${escHtml(inv.hosts || 'Ești invitat!')}</p>
<p class="kd-hint">Sparge baloanele ca să afli când și unde</p>
<div class="kd-row">${slots}</div>
<p class="kd-end" aria-live="polite">${escHtml(KINDS[inv.kind].wish ?? 'Te așteptăm cu drag!')}</p></div>${SND}${SKIP}</div>
<canvas class="petals" data-petals="${CONFETTI}" data-shape="confetti" data-at="done" aria-hidden="true"></canvas>`;
}

function film(): string {
  const n = (x: number) => `<span class="ld-n" style="--k:${x}">${3 - x}</span>`;
  return `<div class="st st-film" data-stage="${SCENE_MS.film}" ${cues('whoosh@0', 'projector@900', 'beep@1000', 'beep@1800', 'beep@2600')}>
<div class="ld" aria-hidden="true">
<svg class="ld-rings" viewBox="0 0 200 200" fill="none" stroke="currentColor"><circle cx="100" cy="100" r="78" stroke-width="2"/><circle cx="100" cy="100" r="92" stroke-width="1"/><path d="M100 0v200 M0 100h200" stroke-width="1"/></svg>
<div class="ld-sweep"></div>${n(0)}${n(1)}${n(2)}</div>
<div class="grain" aria-hidden="true"></div><div class="scr" aria-hidden="true"></div><div class="st-flash" aria-hidden="true"></div>${SND}${SKIP}</div>`;
}

/** The layer behind the envelope (or curtain) that plays once it opens. */
export function stage(inv: Invitation, t: Theme): string {
  switch (sceneOf(inv.kind)) {
    case 'nunta':
      return wedding(inv, t);
    case 'botez':
      return baptism(inv);
    case 'cununie':
      return civil(inv);
    case 'aniversare':
      return birthday(inv);
    case 'copii':
      return kids(inv);
    case 'film':
      return film();
    default:
      return '';
  }
}

/** Film night opens on a curtain instead of an envelope. */
export function curtain(guest: string): string {
  const to = guest ? `Un bilet pentru ${escHtml(guest)}` : 'Ai un bilet la film';
  return `<div class="cur" data-env>
<div class="cur-l" aria-hidden="true"></div><div class="cur-r" aria-hidden="true"></div><div class="cur-top" aria-hidden="true"></div>
<div class="cur-body"><p class="cur-kind">Seara de film</p><p class="cur-to">${to}</p>
<button class="cur-go" type="button" data-open>Intră în sală</button>
<p class="env-hint">Atinge ca să se ridice cortina</p></div></div>`;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function sceneCss(): string {
  return `
/* scenes: one full-screen layer, played once after opening */
.st{position:fixed;inset:0;z-index:9;overflow:hidden;transition:opacity .8s ease}
.st.st-out{opacity:0;pointer-events:none}
.st-skip{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:3;font:inherit;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;padding:10px 14px;background:transparent;color:inherit;border:1px solid currentColor;opacity:0;cursor:pointer}
.is-playing .st-skip{animation:fadein .4s 1.4s forwards}
.is-playing body{overflow:hidden}
.petals{position:fixed;inset:0;width:100%;height:100%;z-index:11;pointer-events:none}
@keyframes fadein{to{opacity:.8}}
@keyframes rise-in{to{opacity:1;transform:none}}
@keyframes pop-in{to{opacity:1;transform:none}}
@keyframes reveal{to{clip-path:inset(0 0 0 0)}}
.st-snd{position:absolute;right:16px;top:calc(16px + env(safe-area-inset-top));z-index:3;width:44px;height:44px;padding:0;display:grid;place-items:center;background:transparent;color:inherit;border:1px solid currentColor;border-radius:50%;opacity:0;cursor:pointer}
.st-snd svg{width:20px;height:20px}
.st-snd .snd-off,.st-snd[aria-pressed=true] .snd-on{display:none}
.st-snd[aria-pressed=true] .snd-off{display:inline}
.is-playing .st-snd{animation:fadein .4s .8s forwards}
.st .draw{stroke-dashoffset:0}
.st button:focus-visible{outline:2px solid currentColor;outline-offset:3px}

/* baptism: stained glass, light, a dove */
.st-bap{background:radial-gradient(90% 60% at 50% 20%,rgba(255,208,140,.42),transparent 70%),var(--paper);color:var(--ink)}
.st-win{position:absolute;left:50%;top:6vh;width:min(44vw,32vh,230px);height:auto;opacity:0;transform:translateX(-50%) scale(.94);filter:drop-shadow(0 0 26px rgba(255,200,120,.55))}
.is-playing .st-win{animation:win 1.6s .7s ease-out forwards}
@keyframes win{to{opacity:1;transform:translateX(-50%)}}
.st-rays{position:absolute;left:50%;top:calc(6vh + min(44vw,32vh,230px)*.8);width:min(120vw,700px);height:62vh;transform:translateX(-50%);opacity:0;pointer-events:none}
.st-rays i{position:absolute;left:50%;top:0;width:34%;height:100%;margin-left:-17%;transform-origin:50% 0;
background:linear-gradient(180deg,rgba(255,214,150,.55),rgba(255,214,150,0) 88%);clip-path:polygon(38% 0,62% 0,100% 100%,0 100%)}
.st-rays i:nth-child(1){transform:rotate(18deg)}
.st-rays i:nth-child(3){transform:rotate(-18deg)}
.is-playing .st-rays{animation:fadein 1.6s 1.3s forwards}
.is-playing .st-rays i:nth-child(2){animation:shim 2.2s 1.6s ease-in-out infinite alternate}
@keyframes shim{to{opacity:.45}}
.st-blbl{position:absolute;left:0;right:0;top:calc(58vh - 2.6rem);margin:0;text-align:center;font-size:.78rem;letter-spacing:.34em;text-transform:uppercase;color:var(--accent);opacity:0}
.is-playing .st-blbl{animation:fadein .8s 4.6s forwards}
.st-bname{position:absolute;left:0;right:0;top:58vh;margin:0;padding:0 20px;text-align:center;font-family:var(--display);font-size:clamp(2.4rem,11vw,5rem);line-height:1.05;
clip-path:inset(0 100% 0 0);text-shadow:0 0 24px rgba(255,196,110,.65)}
/* the reveal edge travels at the dove's speed (140vw in 3s), just behind its body */
.is-playing .st-bname{animation:reveal 2.15s 2.75s linear forwards}
.st-dove{position:absolute;left:0;top:calc(58vh - 6vh);width:min(30vw,150px);height:auto;color:var(--accent);stroke-width:2;transform:translateX(-36vw)}
.is-playing .st-dove{animation:fly 3s 2.2s linear forwards}
@keyframes fly{25%{transform:translate(0,-14px)}50%{transform:translate(35vw,6px)}75%{transform:translate(70vw,-18px)}100%{transform:translate(108vw,-44px)}}

/* civil wedding: a pen writes the names, a stamp says DA */
.st-civ{background:var(--deep);color:var(--ink);display:grid;place-items:center}
.civ-sheet{position:relative;width:min(88vw,460px);padding:40px 22px 74px;text-align:center;background:var(--paper);border:1px solid var(--line);box-shadow:0 30px 60px -30px rgba(0,0,0,.5);opacity:0;transform:translateY(30px)}
.is-playing .civ-sheet{animation:rise-in .9s .4s cubic-bezier(.2,.7,.2,1) forwards,thud .3s 4.7s ease-out}
@keyframes thud{0%,100%{transform:none}35%{transform:translateY(3px) scale(.99)}}
.civ-head{margin:0 0 18px;font-size:.75rem;letter-spacing:.3em;text-transform:uppercase;color:var(--accent)}
.civ-row{margin:4px 0}
.civ-line{position:relative;display:inline-block}
.civ-name{display:inline-block;padding:0 .12em;font-family:var(--display);font-style:italic;font-size:clamp(2rem,9vw,3.4rem);line-height:1.15;border-bottom:1px solid var(--line);clip-path:inset(0 100% 0 0)}
.is-playing .civ-name{animation:reveal 1.3s calc(1.5s + var(--k)*1.5s) linear forwards}
.civ-pen{position:absolute;left:0;bottom:.15em;width:30px;height:30px;color:var(--accent);opacity:0;pointer-events:none}
.is-playing .civ-pen{animation:pen 1.3s calc(1.5s + var(--k)*1.5s) linear both}
@keyframes pen{0%{left:0;opacity:0}8%,88%{opacity:1}100%{left:100%;opacity:0}}
.civ-and{margin:2px 0;font-family:var(--display);font-style:italic;color:var(--accent);opacity:0}
.is-playing .civ-and{animation:fadein .5s 2.85s forwards}
.civ-stamp{position:absolute;right:12px;bottom:8px;width:clamp(96px,26vw,124px);height:auto;color:#B23A30;font-family:var(--body);opacity:0;transform:rotate(-14deg) scale(2.2)}
.is-playing .civ-stamp{animation:stamp .3s 4.4s cubic-bezier(.5,0,.9,.4) forwards}
@keyframes stamp{to{opacity:.88;transform:rotate(-14deg)}}

/* birthday: confetti, a cake, candles to blow out */
.st-bd{background:radial-gradient(60% 45% at 50% 58%,rgba(255,176,90,.22),transparent 70%),#1C1726;color:#F6EBDD;display:grid;place-items:center;text-align:center}
.bd-in{position:relative;width:100%;padding:0 20px;display:flex;flex-direction:column;align-items:center}
.bd-age{position:absolute;left:0;right:0;top:50%;margin:0;transform:translateY(-58%);font-family:var(--display);font-size:min(58vw,340px);line-height:1;opacity:.09;pointer-events:none}
.bd-hint{margin:0 0 18px;font-size:1.05rem;letter-spacing:.04em;opacity:0}
.is-playing .bd-hint{animation:fadein .6s 1.2s forwards}
.is-playing .st-done .bd-hint{animation:none;opacity:0;transition:opacity .3s}
.bd-cake{position:relative;width:min(76vw,340px);aspect-ratio:240/200;opacity:0;transform:translateY(24px)}
.is-playing .bd-cake{animation:rise-in .8s .5s cubic-bezier(.2,.7,.2,1) forwards}
.bd-svg{display:block;width:100%;height:100%}
.bd-c{position:absolute;bottom:66%;width:15%;height:34%;padding:0;transform:translateX(-50%);background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bd-stick{position:absolute;left:50%;bottom:0;width:22%;height:56%;transform:translateX(-50%);border-radius:3px;background:repeating-linear-gradient(135deg,#fff 0 5px,#E58FB0 5px 9px)}
.bd-flame{position:absolute;left:32%;bottom:58%;width:36%;height:34%;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;transform-origin:50% 90%;
background:radial-gradient(circle at 50% 70%,#fff 0 18%,#FFD36B 32%,#F39A2B 68%,rgba(243,154,43,0) 72%);box-shadow:0 0 18px 6px rgba(255,190,90,.4);
animation:flame .9s calc(var(--k)*-.23s) ease-in-out infinite alternate;transition:opacity .25s,transform .25s}
@keyframes flame{0%{transform:rotate(-3deg)}50%{transform:scale(1.08,.94) rotate(2deg)}100%{transform:scale(.95,1.06) rotate(-1deg)}}
.bd-c.off .bd-flame{animation:none;opacity:0;transform:scale(.2)}
.bd-smoke{position:absolute;left:45%;bottom:62%;width:10%;height:30%;border-radius:50%;background:rgba(210,210,210,.6);filter:blur(3px);opacity:0}
.bd-c.off .bd-smoke{animation:smoke 1.4s ease-out forwards}
@keyframes smoke{0%{opacity:.8}100%{opacity:0;transform:translate(6px,-60px) scale(2.4,3)}}
.bd-wish{margin:22px 0 0;font-family:var(--display);font-size:clamp(2.4rem,11vw,4.6rem);line-height:1.05;opacity:0;transform:scale(.8)}
.st-done .bd-wish{animation:pop-in .7s cubic-bezier(.3,1.5,.5,1) forwards}
.bd-who{margin:8px 0 0;opacity:0}
.st-done .bd-who{animation:fadein .6s .3s forwards}

/* kids' party: balloons hide when and where */
.st-kid{background:radial-gradient(circle,rgba(243,167,18,.18) 2px,transparent 2.5px) 0 0/26px 26px,var(--paper);color:var(--ink);display:grid;place-items:center;text-align:center}
.kd-in{width:100%;padding:0 16px;display:flex;flex-direction:column;align-items:center}
.kd-lbl{margin:0;font-size:.78rem;letter-spacing:.3em;text-transform:uppercase;color:var(--accent);opacity:0}
.kd-who{margin:6px 0 0;font-family:var(--display);font-size:clamp(2.2rem,10vw,4.2rem);line-height:1.05;opacity:0;transform:scale(.8)}
.is-playing .kd-lbl{animation:pop-in .6s .3s forwards}
.is-playing .kd-who{animation:pop-in .8s .45s cubic-bezier(.3,1.5,.5,1) forwards}
.kd-hint{margin:14px 0 0;font-size:.95rem;color:var(--muted);opacity:0}
.is-playing .kd-hint{animation:fadein .6s 1.9s forwards}
.is-playing .st-done .kd-hint{animation:none;opacity:0}
.kd-row{display:flex;justify-content:center;gap:clamp(8px,3vw,28px);width:100%;margin-top:18px}
.kb-slot{position:relative;width:min(28vw,150px)}
.kb{display:block;width:100%;padding:0;background:none;border:0;color:var(--c);cursor:pointer;transform:translateY(90vh);-webkit-tap-highlight-color:transparent}
.kb svg{display:block;width:100%;height:auto;overflow:visible}
.is-playing .kb{animation:kb-up 1.5s calc(.4s + var(--k)*.2s) cubic-bezier(.2,.8,.3,1) forwards,kb-bob 2.4s calc(1.9s + var(--k)*.3s) ease-in-out infinite alternate}
@keyframes kb-up{to{transform:none}}
@keyframes kb-bob{from{transform:none}to{transform:translateY(-10px) rotate(2deg)}}
.is-playing .kb.off{animation:kb-burst .25s ease-out forwards;pointer-events:none}
@keyframes kb-burst{0%{transform:none}40%{transform:scale(1.25);opacity:1}100%{transform:scale(1.5);opacity:0}}
.kc{position:absolute;left:0;right:0;top:12%;margin:0;display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0;transform:scale(.5);pointer-events:none}
.kc span{font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
.kc b{font-family:var(--display);font-weight:500;font-size:clamp(1rem,4.6vw,1.5rem);line-height:1.15;overflow-wrap:anywhere}
.kb.off~.kc{animation:pop-in .5s .08s cubic-bezier(.3,1.6,.5,1) forwards}
.kd-end{margin:22px 0 0;font-family:var(--display);font-size:clamp(1.8rem,8vw,3rem);line-height:1.1;opacity:0;transform:scale(.8)}
.st-done .kd-end{animation:pop-in .7s cubic-bezier(.3,1.5,.5,1) forwards}

/* wedding */
.st-wed{background:var(--paper);color:var(--gold);display:grid;place-items:center}
.st-in{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px}
.st-couple{width:min(62vw,300px);height:auto}
.sd{stroke-dasharray:1;stroke-dashoffset:1}
.is-playing .sd{animation:draw 2.8s 2s cubic-bezier(.55,0,.25,1) forwards}
.st-rings{width:min(40vw,170px);height:auto;margin-top:-6px;opacity:0}
.is-playing .st-rings{animation:fadein .5s 4.5s forwards}
.ring-l,.ring-r{transition:none}
.is-playing .ring-l{animation:ringL .8s 4.9s cubic-bezier(.5,0,.2,1) forwards}
.is-playing .ring-r{animation:ringR .8s 4.9s cubic-bezier(.5,0,.2,1) forwards}
@keyframes ringL{to{transform:translateX(22px)}}
@keyframes ringR{to{transform:translateX(-22px)}}
.spark{opacity:0;transform-origin:80px 23px;transform:scale(.2)}
.is-playing .spark{animation:spark .9s 5.65s ease-out forwards}
@keyframes spark{40%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(1.6) rotate(25deg)}}
.st-names{font-family:var(--display);font-size:clamp(2.2rem,9vw,4.4rem);line-height:1.05;color:var(--ink);margin:18px 0 0;opacity:0;letter-spacing:.12em;filter:blur(6px)}
.st-names i{color:var(--gold);font-style:italic}
.is-playing .st-names{animation:names 1.4s 5.9s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes names{to{opacity:1;letter-spacing:-.01em;filter:none}}
.st-veil{position:absolute;inset:-6% -4% 0;z-index:2;transform-origin:50% 0;
background:repeating-linear-gradient(90deg,rgba(255,255,255,.86) 0 26px,rgba(255,255,255,.7) 26px 52px)}
.st-veil::after{content:'';position:absolute;left:0;right:0;bottom:-16px;height:16px;
background:radial-gradient(circle at 13px 0,rgba(255,255,255,.86) 12px,transparent 12.5px) 0 0/26px 16px repeat-x}
.is-playing .st-veil{animation:veil 1.9s 1.3s cubic-bezier(.6,0,.25,1) forwards}
@keyframes veil{25%{transform:translateY(3%) skewX(-1.5deg)}100%{transform:translateY(-118%) scaleX(.8) skewX(2deg)}}

/* film night: curtain */
.cur{position:fixed;inset:0;z-index:10;display:grid;place-items:center;color:#F4E6CF;overflow:hidden}
.cur-l,.cur-r{position:absolute;top:0;bottom:0;width:51%;transition:transform 1.35s cubic-bezier(.6,0,.2,1);
background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 22%,transparent 70%,rgba(0,0,0,.45)),repeating-linear-gradient(90deg,#4E0C14 0,#8A1A25 14px,#A8283A 22px,#7A1520 32px,#4E0C14 44px)}
.cur-l{left:0;transform-origin:0 50%}
.cur-r{right:0;transform-origin:100% 50%}
.cur-top{position:absolute;left:0;right:0;top:0;height:clamp(54px,9vh,90px);z-index:1;background:#5C0E17;border-bottom:3px solid #C9A25E;
-webkit-mask:radial-gradient(circle at 50% 100%,transparent 18px,#000 18.5px) 0 0/48px 100%;mask:radial-gradient(circle at 50% 100%,transparent 18px,#000 18.5px) 0 0/48px 100%;transition:transform 1s .3s ease}
.cur-body{position:relative;z-index:2;text-align:center;padding:0 24px;transition:opacity .35s}
.cur-kind{font-size:.75rem;letter-spacing:.34em;text-transform:uppercase;color:#C9A25E;margin:0 0 14px}
.cur-to{font-family:var(--display);font-size:clamp(1.8rem,7vw,3rem);line-height:1.1;margin:0 0 34px}
.cur-go{font:inherit;font-size:.9rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;padding:16px 26px;border:1px solid #C9A25E;background:#1A0A0C;color:#F4E6CF;cursor:pointer;animation:pulse 2.4s ease-in-out infinite;--on-deep:#C9A25E}
.cur-go:focus-visible{outline:2px solid #C9A25E;outline-offset:6px}
.is-open .cur{opacity:0;pointer-events:none;transition:opacity .5s 1.25s}
.is-open .cur-body{opacity:0}
.is-open .cur-l{transform:scaleX(.14)}
.is-open .cur-r{transform:scaleX(.14)}
.is-open .cur-top{transform:translateY(-100%)}

/* film night: countdown leader */
.st-film{background:#17140F;color:#E9E1D0;display:grid;place-items:center}
.ld{position:relative;width:min(78vw,420px);aspect-ratio:1;display:grid;place-items:center;opacity:0}
.is-playing .ld{animation:fadein .3s .9s forwards,flick .18s 1.2s steps(2) 12}
.ld-rings{position:absolute;inset:0;width:100%;height:100%;opacity:.7}
.ld-sweep{position:absolute;inset:8%;border-radius:50%;background:conic-gradient(rgba(233,225,208,.24) 0 25%,transparent 25%)}
.is-playing .ld-sweep{animation:spin .8s 1s linear 3}
@keyframes spin{to{transform:rotate(360deg)}}
.ld-n{position:absolute;font-family:var(--display);font-size:min(40vw,220px);line-height:1;font-variant-numeric:lining-nums;opacity:0}
.is-playing .ld-n{animation:num .8s calc(1s + var(--k)*.8s) both}
@keyframes num{0%,100%{opacity:0}2%,96%{opacity:1}}
@keyframes flick{50%{opacity:.82}}
.grain{position:absolute;inset:-50%;background-image:${GRAIN};opacity:.16;pointer-events:none}
.is-playing .grain{animation:grain .5s steps(5) infinite}
@keyframes grain{20%{transform:translate(-4%,3%)}40%{transform:translate(3%,-5%)}60%{transform:translate(-6%,-2%)}80%{transform:translate(5%,4%)}}
.scr{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 31%,rgba(233,225,208,.22) 31.2%,transparent 31.4%,transparent 72%,rgba(233,225,208,.14) 72.1%,transparent 72.3%)}
.is-playing .scr{animation:scr .35s steps(3) infinite}
@keyframes scr{33%{transform:translateX(9%)}66%{transform:translateX(-14%)}}
.st-flash{position:absolute;inset:0;background:#FFF8EA;opacity:0;pointer-events:none}
.is-playing .st-flash{animation:flash .55s 3.4s ease-out forwards}
@keyframes flash{30%{opacity:.9}100%{opacity:0}}

@media (prefers-reduced-motion:reduce){
  .st,.petals{display:none}
  .cur-l,.cur-r,.cur-top{transition:opacity .3s}
  .is-open .cur-l,.is-open .cur-r,.is-open .cur-top{transform:none;opacity:0}
  .cur-go{animation:none}
}`;
}

interface Petal {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  sp: number;
  rot: number;
  vr: number;
  c: string;
}

/**
 * Petals falling on a canvas: a few dozen shapes, one draw per frame, so it
 * stays smooth on a cheap phone. They stop spawning after `ms`, fade out and
 * remove the canvas. Returns a function that hurries the fade (for "skip").
 */
export function petals(canvas: HTMLCanvasElement, win: Window, ms = 9000): () => void {
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) {
    canvas.remove();
    return () => {};
  }
  const g = ctx;
  const colors = (canvas.dataset.petals || '#E8C6C0').split(',');
  const confetti = canvas.dataset.shape === 'confetti';
  const dpr = Math.min(win.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const size = () => {
    w = win.innerWidth;
    h = win.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  win.addEventListener('resize', size);

  const n = w < 600 ? 24 : 38;
  const P: Petal[] = Array.from({ length: n }, (_, i) => ({
    x: Math.random() * w,
    // confetti bursts already on screen; petals drift in from above
    y: confetti ? h * (0.3 - Math.random() * 0.7) : -20 - Math.random() * h * 0.9,
    r: confetti ? 6 + Math.random() * 5 : 5 + Math.random() * 6,
    vy: confetti ? 1.6 + Math.random() * 1.8 : 0.6 + Math.random() * 0.9,
    sway: Math.random() * 6.28,
    sp: 0.012 + Math.random() * 0.02,
    rot: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * (confetti ? 0.2 : 0.05),
    c: colors[i % colors.length],
  }));

  const t0 = win.performance.now();
  let last = t0;
  let hurry = 0;
  let raf = 0;
  const end = () => {
    win.cancelAnimationFrame(raf);
    win.removeEventListener('resize', size);
    canvas.remove();
  };
  const frame = (now: number) => {
    const k = Math.min(3, (now - last) / 16.7);
    last = now;
    const el = now - t0;
    let alpha = el > ms ? 1 - (el - ms) / 1400 : 1;
    if (hurry) alpha = Math.min(alpha, 1 - (now - hurry) / 500);
    if (alpha <= 0) return end();
    g.clearRect(0, 0, w, h);
    g.globalAlpha = alpha * 0.9;
    for (const q of P) {
      q.sway += q.sp * k;
      q.y += q.vy * k;
      q.x += Math.sin(q.sway) * 0.7 * k;
      q.rot += q.vr * k;
      if (q.y > h + 20 && el < ms) {
        q.y = -20;
        q.x = Math.random() * w;
      }
      g.save();
      g.translate(q.x, q.y);
      g.rotate(q.rot);
      g.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(q.sway * 1.6)));
      g.fillStyle = q.c;
      if (confetti) {
        g.fillRect(-q.r * 0.5, -q.r * 0.3, q.r, q.r * 0.6);
        g.restore();
        continue;
      }
      g.beginPath();
      g.moveTo(0, -q.r);
      g.bezierCurveTo(q.r, -q.r * 0.6, q.r * 0.8, q.r * 0.7, 0, q.r);
      g.bezierCurveTo(-q.r * 0.8, q.r * 0.7, -q.r, -q.r * 0.6, 0, -q.r);
      g.fill();
      g.restore();
    }
    raf = win.requestAnimationFrame(frame);
  };
  raf = win.requestAnimationFrame(frame);
  return () => {
    if (!hurry) hurry = win.performance.now();
  };
}
