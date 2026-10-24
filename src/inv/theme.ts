import type { FontId, Invitation, TemplateId, TintId } from './types';

/**
 * Three art directions. Each one changes the display face, the palette and the
 * hero composition, not just a colour:
 *   clasic  - ivory paper, oxblood ink, Cormorant italic, centred monogram;
 *   botanic - sage and deep forest surfaces, Instrument Serif, a sprig drawn in line;
 *   seara   - night blue, champagne, Bodoni Moda, the date set as large numerals.
 */

export interface Theme {
  id: TemplateId;
  label: string;
  display: string;
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  /** Full-bleed surface for the RSVP and message sections. */
  deep: string;
  onDeep: string;
  line: string;
}

export const THEMES: Record<TemplateId, Theme> = {
  clasic: {
    id: 'clasic',
    label: 'Clasic',
    display: "'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif",
    paper: '#F5F0E6',
    ink: '#2A2420',
    muted: '#6E625A',
    accent: '#7A2E2E',
    deep: '#7A2E2E',
    onDeep: '#F8F1E7',
    line: 'rgba(42,36,32,.22)',
  },
  botanic: {
    id: 'botanic',
    label: 'Botanic',
    display: "'Instrument Serif', Georgia, serif",
    paper: '#E6EADF',
    ink: '#1B2A20',
    muted: '#4E5E52',
    accent: '#9A6B22',
    deep: '#1F3326',
    onDeep: '#EEF0E6',
    line: 'rgba(27,42,32,.22)',
  },
  seara: {
    id: 'seara',
    label: 'Seară',
    display: "'Bodoni Moda Variable', 'Bodoni Moda', Didot, serif",
    paper: '#12141B',
    ink: '#EDE3CC',
    muted: '#A79F8C',
    accent: '#D9BE86',
    deep: '#D9BE86',
    onDeep: '#12141B',
    line: 'rgba(237,227,204,.2)',
  },
};

/**
 * Colours a host can lay over any style. On the light styles they recolour the
 * accent and the full-bleed sections; on Seară (dark paper) the lighter `night`
 * tone does both, so text keeps its contrast.
 */
export const TINTS: Record<TintId, { label: string; accent: string; deep: string; night: string }> = {
  vin: { label: 'Roșu de vin', accent: '#7A2E2E', deep: '#6B2626', night: '#E3AEA6' },
  salvie: { label: 'Verde salvie', accent: '#4F6B4A', deep: '#2F4A35', night: '#BCD0AB' },
  albastru: { label: 'Albastru', accent: '#2E4A7A', deep: '#1F3358', night: '#AFC4E8' },
  roz: { label: 'Roz pudrat', accent: '#A8505E', deep: '#8E4652', night: '#EDBAC0' },
  auriu: { label: 'Auriu', accent: '#8C6220', deep: '#6E4C17', night: '#D9BE86' },
  teracota: { label: 'Teracotă', accent: '#A44B2A', deep: '#8A3E22', night: '#E9A88A' },
  lavanda: { label: 'Lavandă', accent: '#65538A', deep: '#4E3F6B', night: '#C9BBE6' },
};

/** Display faces, all self-hosted with Romanian letters (ș, ț). */
export const FONTS: Record<FontId, { label: string; stack: string }> = {
  cormorant: { label: 'Cormorant', stack: "'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif" },
  instrument: { label: 'Instrument', stack: "'Instrument Serif', Georgia, serif" },
  bodoni: { label: 'Bodoni', stack: "'Bodoni Moda Variable', 'Bodoni Moda', Didot, serif" },
  playfair: { label: 'Playfair', stack: "'Playfair Display Variable', 'Playfair Display', Georgia, serif" },
  vibes: { label: 'Caligrafic', stack: "'Great Vibes', 'Snell Roundhand', cursive" },
  fraunces: { label: 'Fraunces', stack: "'Fraunces Variable', 'Fraunces', Georgia, serif" },
  baloo: { label: 'Rotunjit', stack: "'Baloo 2 Variable', 'Baloo 2', 'Trebuchet MS', sans-serif" },
};

/** The style with the host's colour and face laid over it. */
export function themeFor(inv: Pick<Invitation, 'template' | 'tint' | 'font'>): Theme {
  const t = THEMES[inv.template] ?? THEMES.clasic;
  const tint = inv.tint ? TINTS[inv.tint] : null;
  const font = inv.font ? FONTS[inv.font] : null;
  const night = t.id === 'seara';
  return {
    ...t,
    ...(tint ? (night ? { accent: tint.night, deep: tint.night } : { accent: tint.accent, deep: tint.deep }) : {}),
    ...(font ? { display: font.stack } : {}),
  };
}

export function fontFaces(base: string): string {
  const f = (family: string, file: string, style: string, weight: string, range: string) =>
    `@font-face{font-family:'${family}';font-style:${style};font-display:swap;font-weight:${weight};` +
    `src:url(${base}/fonts/${file}) format('woff2');unicode-range:${range}}`;
  const LATIN =
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const EXT =
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const out: string[] = [];
  const variable: [string, string, string][] = [
    ['Cormorant Garamond Variable', 'cormorant-garamond', '300 700'],
    ['Bodoni Moda Variable', 'bodoni-moda', '400 900'],
    ['Jost Variable', 'jost', '100 900'],
  ];
  for (const [family, file, w] of variable) {
    for (const style of ['normal', 'italic']) {
      out.push(f(family, `${file}-latin-wght-${style}.woff2`, style, w, LATIN));
      out.push(f(family, `${file}-latin-ext-wght-${style}.woff2`, style, w, EXT));
    }
  }
  const extra: [string, string, string, string[]][] = [
    ['Playfair Display Variable', 'playfair', '400 900', ['normal', 'italic']],
    ['Fraunces Variable', 'fraunces', '300 900', ['normal', 'italic']],
    ['Great Vibes', 'vibes', '400', ['normal']],
    ['Baloo 2 Variable', 'baloo', '400 800', ['normal']],
  ];
  for (const [family, file, w, styles] of extra) {
    for (const style of styles) {
      out.push(f(family, `${file}-latin-${style}.woff2`, style, w, LATIN));
      out.push(f(family, `${file}-latin-ext-${style}.woff2`, style, w, EXT));
    }
  }
  for (const style of ['normal', 'italic']) {
    out.push(f('Instrument Serif', `instrument-serif-latin-400-${style}.woff2`, style, '400', LATIN));
    out.push(f('Instrument Serif', `instrument-serif-latin-ext-400-${style}.woff2`, style, '400', EXT));
  }
  return out.join('\n');
}
