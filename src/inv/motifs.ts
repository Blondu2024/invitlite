import type { EventKind } from './types';

/**
 * Original line drawings, one family per event. Every path is drawn by hand for
 * this project (no third-party artwork). They inherit the theme accent through
 * currentColor and draw themselves in when the envelope opens (class "draw").
 *   main  - the large motif in the hero and on the envelope;
 *   small - the ornament above the quote.
 */

const svg = (cls: string, viewBox: string, body: string) =>
  `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const p = (d: string) => `<path class="draw" pathLength="1" d="${d}"/>`;
const c = (cx: number, cy: number, r: number) => `<circle class="draw" pathLength="1" cx="${cx}" cy="${cy}" r="${r}"/>`;

/** Two wedding rings, a stone on one, a sprig of leaves above. */
const RINGS =
  c(47, 66, 24) + c(47, 66, 19.5) + c(73, 66, 24) + c(73, 66, 19.5) +
  p('M67 42l6-8 6 8z M67 34l6-6 6 6') +
  p('M18 40c8-12 18-18 32-20') +
  p('M27 32c-3-6-1-11 5-13 1 6-1 10-5 13z M36 26c0-6 3-10 9-11 0 6-3 9-9 11z M24 40c-6-1-9-5-9-10 6 0 9 4 9 10z');

/** A dove in flight, one wing raised, an olive branch in its beak. */
const DOVE =
  p('M34 62C44 74 64 80 82 74c9-3 15-9 18-16') +
  p('M100 58c2-7-1-13-7-15-7-2-12 2-14 6-14-4-30 1-45 13') +
  p('M34 62L10 52l14 11-15 8 25-9') +
  p('M100 50l9 3-8 4') +
  c(92, 51, 1.2) +
  p('M62 54C58 36 47 22 28 12c3 8 3 14 0 19 6 2 11 6 13 11 6 0 11 3 15 8') +
  p('M106 56c4 5 5 11 3 18 M108 63c5-1 8 1 9 5-5 1-8-1-9-5z M109 70c-5 0-8 3-8 7 5 0 8-3 8-7z');

/** A baptism candle: flame, a drip of wax, a bow tied around it. */
const CANDLE =
  p('M23 48h14v64H23z') +
  p('M30 16c7 8 9 16 0 25-9-9-7-17 0-25z M30 29c2 3 2 6 0 8-2-2-2-5 0-8z') +
  p('M30 41v7') +
  p('M23 54c3 0 3 6 6 6s3-6 8-6') +
  p('M23 76h14 M30 76c-6-7-15-7-15 0s9 7 15 0z M30 76c6-7 15-7 15 0s-9 7-15 0z M28 78l-6 13 M32 78l6 13');

/** A tied bouquet: three blooms, two leaves, a ribbon. */
const BOUQUET =
  p('M50 112L42 60 M50 112L50 56 M50 112L59 60') +
  c(40, 50, 9) + c(40, 50, 3) + c(60, 46, 9) + c(60, 46, 3) + c(50, 32, 9) + c(50, 32, 3) +
  p('M44 72c-10-2-16-8-18-16 10 0 16 6 18 16z M56 74c10-2 16-8 18-16-10 0-16 6-18 16z') +
  p('M40 88c6 4 14 4 20 0 M46 90l-6 13 M54 90l6 13');

/** A two-tier cake with two lit candles and a little confetti. */
const CAKE =
  p('M20 100h60V74H20z M29 74V54h42v20') +
  p('M20 82c5 4 10 4 15 0 5 4 10 4 15 0 5 4 10 4 15 0 5 4 10 4 15 0') +
  p('M10 100h80') +
  p('M42 54V40 M58 54V40') +
  p('M42 30c3 3 3 7 0 9-3-2-3-6 0-9z M58 30c3 3 3 7 0 9-3-2-3-6 0-9z') +
  p('M14 30l4 4 M86 24l-4 4 M82 46l6-2 M17 54l-6-2');

/** One open flower, five round petals, a short stem with two leaves. */
const FLOWER =
  c(50, 18, 7) + c(59.5, 24.9, 7) + c(55.9, 36.1, 7) + c(44.1, 36.1, 7) + c(40.5, 24.9, 7) + c(50, 28, 3.5) +
  p('M50 43v11 M50 51c-6-1-9-4-10-8 5 0 9 3 10 8z M50 49c6-1 9-4 10-8-5 0-9 3-10 8z');

const RINGS_SMALL = c(42, 30, 13) + c(58, 30, 13);

const BALLOONS =
  p('M38 6c9 0 15 8 15 17 0 10-7 17-15 17s-15-7-15-17c0-9 6-17 15-17z') +
  p('M64 12c7 0 12 6 12 14 0 8-6 14-12 14s-12-6-12-14c0-8 5-14 12-14z') +
  p('M36 43l2-3 2 3z M62 43l2-3 2 3z') +
  p('M38 43c-3 8 3 12 0 18 M64 43c3 8-3 12 0 18');

export function mainMotif(kind: EventKind, cls = 'motif'): string {
  switch (kind) {
    case 'botez':
      return svg(`${cls} m-dove`, '0 0 124 100', DOVE);
    case 'cununie':
      return svg(`${cls} m-bouquet`, '0 0 100 116', BOUQUET);
    case 'aniversare':
      return svg(`${cls} m-cake`, '0 0 100 108', CAKE);
    default:
      return svg(`${cls} m-rings`, '0 0 120 96', RINGS);
  }
}

export function smallMotif(kind: EventKind, cls = 'orn'): string {
  switch (kind) {
    case 'botez':
      return svg(`${cls} m-candle`, '0 0 60 116', CANDLE);
    case 'cununie':
      return svg(`${cls} m-rings-s`, '0 0 100 60', RINGS_SMALL);
    case 'aniversare':
      return svg(`${cls} m-balloons`, '0 0 100 64', BALLOONS);
    default:
      return svg(`${cls} m-flower`, '0 0 100 58', FLOWER);
  }
}
