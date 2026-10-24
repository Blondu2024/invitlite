import { escHtml } from './sanitize';
import type { Theme } from './theme';
import type { Invitation } from './types';

/**
 * Entrance scenes. Each one is a full-screen layer that plays once, after the
 * guest opens the invitation, then dissolves into the page underneath. All of
 * it lives in the site code: nothing here adds a byte to the link.
 *   nunta - the envelope opens, a veil lifts, petals fall, the couple is drawn
 *           in gold line, two rings meet and spark, the names arrive;
 *   film  - a velvet curtain parts on an old cinema countdown, 3 2 1, and the
 *           invitation lands as a ticket.
 * Line art is drawn by hand for this project.
 */

/** How long each scene runs from the tap, in ms. Kinds without a scene are absent. */
export const SCENE_MS: Partial<Record<Invitation['kind'], number>> = { nunta: 7800, film: 3900 };

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

function wedding(inv: Invitation, t: Theme): string {
  const names = inv.hosts
    ? escHtml(inv.hosts).replace(/\s*&amp;\s*/, '<i> &amp; </i>')
    : 'Nunta noastră';
  return `<div class="st st-wed" data-stage="${SCENE_MS.nunta}" style="--gold:${GOLD[t.id]}">
<div class="st-veil" aria-hidden="true"></div>
<div class="st-in" aria-hidden="true">
<svg class="st-couple" viewBox="0 0 200 220" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${COUPLE}</svg>
${RINGS}
<p class="st-names">${names}</p></div>${SKIP}</div>
<canvas class="petals" data-petals="${PETALS[t.id]}" aria-hidden="true"></canvas>`;
}

function film(): string {
  const n = (x: number) => `<span class="ld-n" style="--k:${x}">${3 - x}</span>`;
  return `<div class="st st-film" data-stage="${SCENE_MS.film}">
<div class="ld" aria-hidden="true">
<svg class="ld-rings" viewBox="0 0 200 200" fill="none" stroke="currentColor"><circle cx="100" cy="100" r="78" stroke-width="2"/><circle cx="100" cy="100" r="92" stroke-width="1"/><path d="M100 0v200 M0 100h200" stroke-width="1"/></svg>
<div class="ld-sweep"></div>${n(0)}${n(1)}${n(2)}</div>
<div class="grain" aria-hidden="true"></div><div class="scr" aria-hidden="true"></div><div class="st-flash" aria-hidden="true"></div>${SKIP}</div>`;
}

/** The layer behind the envelope (or curtain) that plays once it opens. */
export function stage(inv: Invitation, t: Theme): string {
  if (inv.kind === 'nunta') return wedding(inv, t);
  if (inv.kind === 'film') return film();
  return '';
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
    y: -20 - Math.random() * h * 0.9,
    r: 5 + Math.random() * 6,
    vy: 0.6 + Math.random() * 0.9,
    sway: Math.random() * 6.28,
    sp: 0.012 + Math.random() * 0.02,
    rot: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 0.05,
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
