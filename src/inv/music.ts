import type { Sound } from './sound';
import type { MusicId } from './types';

/**
 * Background music, composed for this project note by note and played by the
 * browser's own synthesiser. No recordings, no samples, nobody else's song:
 * the chords are common property, the melodies were written here. Each tune is
 * a loop of 8 to 16 bars scheduled a fraction of a second ahead, so it keeps
 * time even when the phone is busy.
 */

export const MUSIC_LABEL: Record<MusicId, { name: string; mood: string }> = {
  vals: { name: 'Vals', mood: 'lin, pentru nuntă' },
  cutie: { name: 'Cutie muzicală', mood: 'blând, pentru botez' },
  pian: { name: 'Pian', mood: 'liniștit, pentru cununie' },
  petrecere: { name: 'Petrecere', mood: 'vesel, cu ritm' },
  jazz: { name: 'Jazz de seară', mood: 'pentru film sau o cină' },
};

type Voice = 'piano' | 'bell' | 'bass' | 'marimba' | 'vibe' | 'hat' | 'brush' | 'clap' | 'kick';

interface Note {
  /** Beat inside the bar. */
  at: number;
  midi: number;
  /** In beats. */
  dur: number;
  v: Voice;
  vel: number;
}

interface Chord {
  pc: number;
  iv: number[];
}

/** One bar of melody: [beat, midi note, length in beats]. */
type Bar = [number, number, number][];

interface Tune {
  bpm: number;
  beats: number;
  lead: Voice;
  chords: string[];
  melody: Bar[];
  /** The accompaniment for one bar. */
  comp: (c: Chord, next: Chord) => Note[];
}

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUALITY: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
};

export function chord(sym: string): Chord {
  const m = /^([A-G])(b|#)?(maj7|m7|m|7)?$/.exec(sym);
  if (!m) throw new Error(`chord ${sym}`);
  const pc = (PC[m[1]] + (m[2] === 'b' ? 11 : m[2] === '#' ? 1 : 0)) % 12;
  return { pc, iv: QUALITY[m[3] ?? ''] };
}

/** MIDI number of a pitch class in an octave (C4 = 60). */
const at = (oct: number, pc: number) => 12 * (oct + 1) + pc;
const n = (beat: number, midi: number, dur: number, v: Voice, vel: number): Note => ({ at: beat, midi, dur, v, vel });

const TUNES: Record<MusicId, Tune> = {
  // F major waltz: a bass note on one, the chord on two and three.
  vals: {
    bpm: 84,
    beats: 3,
    lead: 'piano',
    chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'F', 'F'],
    melody: [
      [[0, 72, 2], [2, 69, 1]],
      [[0, 74, 1.5], [1.5, 72, 0.5], [2, 69, 1]],
      [[0, 70, 2], [2, 74, 1]],
      [[0, 72, 3]],
      [[0, 69, 1], [1, 72, 1], [2, 77, 1]],
      [[0, 76, 2], [2, 72, 1]],
      [[0, 74, 1], [1, 77, 1], [2, 74, 1]],
      [[0, 72, 2], [2, 70, 1]],
      [[0, 69, 1.5], [1.5, 74, 0.5], [2, 77, 1]],
      [[0, 77, 1.5], [1.5, 76, 0.5], [2, 74, 1]],
      [[0, 72, 1], [1, 69, 1], [2, 72, 1]],
      [[0, 67, 3]],
      [[0, 70, 1], [1, 74, 1], [2, 77, 1]],
      [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 1]],
      [[0, 77, 3]],
      [],
    ],
    comp: (c) => [
      n(0, at(2, c.pc), 1, 'bass', 0.55),
      ...[1, 2].flatMap((b) => c.iv.map((i) => n(b, at(4, c.pc) + i - (c.pc > 7 ? 12 : 0), 0.7, 'piano', 0.13))),
    ],
  },

  // A music box in C: a rocking arpeggio under a small tune in 3/4.
  cutie: {
    bpm: 92,
    beats: 3,
    lead: 'bell',
    chords: ['C', 'G', 'Am', 'F', 'C', 'F', 'G', 'C'],
    melody: [
      [[0, 88, 1], [1, 86, 0.5], [1.5, 84, 0.5], [2, 79, 1]],
      [[0, 86, 2], [2, 83, 1]],
      [[0, 84, 1], [1, 88, 1], [2, 81, 1]],
      [[0, 81, 2], [2, 84, 1]],
      [[0, 79, 1], [1, 84, 1], [2, 88, 1]],
      [[0, 81, 1], [1, 84, 0.5], [1.5, 86, 0.5], [2, 84, 1]],
      [[0, 83, 1], [1, 86, 1], [2, 79, 1]],
      [[0, 84, 3]],
    ],
    comp: (c) => {
      const r = at(4, c.pc) - (c.pc > 4 ? 12 : 0);
      return [
        n(0, r - 12, 3, 'bell', 0.16),
        ...[0, 7, 12, 12 + c.iv[1], 12, 7].map((o, i) => n(i * 0.5, r + o, 0.5, 'bell', 0.09)),
      ];
    },
  },

  // Slow piano in A minor, eighth-note arpeggios and a long-breathed line.
  pian: {
    bpm: 70,
    beats: 4,
    lead: 'piano',
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'],
    melody: [
      [[0, 76, 3], [3, 72, 1]],
      [[0, 69, 2], [2, 72, 2]],
      [[0, 79, 3], [3, 76, 1]],
      [[0, 74, 4]],
      [[0, 76, 1.5], [1.5, 81, 2.5]],
      [[0, 79, 1], [1, 77, 1], [2, 72, 2]],
      [[0, 74, 2], [2, 77, 2]],
      [[0, 76, 2], [2, 71, 2]],
    ],
    comp: (c) => {
      const r = at(3, c.pc) - (c.pc > 7 ? 12 : 0);
      return [0, 7, 12, 12 + c.iv[1], 19, 12 + c.iv[1], 12, 7].map((o, i) => n(i * 0.5, r + o, 1.2, 'piano', 0.11));
    },
  },

  // Bouncy C major: kick, clap, hats, a jumping bass and a marimba tune.
  petrecere: {
    bpm: 116,
    beats: 4,
    lead: 'marimba',
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'],
    melody: [
      [[0, 79, 0.5], [0.5, 76, 0.5], [1, 79, 0.5], [1.5, 84, 1], [3, 79, 0.5], [3.5, 81, 0.5]],
      [[0, 81, 0.5], [0.5, 79, 0.5], [1, 76, 1], [2, 72, 0.5], [2.5, 76, 0.5], [3, 81, 1]],
      [[0, 77, 0.5], [0.5, 81, 0.5], [1, 84, 1], [2, 81, 0.5], [2.5, 77, 0.5], [3, 79, 1]],
      [[0, 83, 0.5], [0.5, 81, 0.5], [1, 79, 1], [2, 74, 1]],
      [[0, 79, 0.5], [0.5, 76, 0.5], [1, 79, 0.5], [1.5, 84, 1], [3, 79, 0.5], [3.5, 81, 0.5]],
      [[0, 84, 1], [1, 83, 0.5], [1.5, 81, 0.5], [2, 76, 1], [3, 79, 1]],
      [[0, 81, 1], [1, 77, 0.5], [1.5, 81, 0.5], [2, 84, 1], [3, 86, 1]],
      [[0, 83, 1.5], [1.5, 79, 0.5], [2, 79, 2]],
    ],
    comp: (c) => {
      const r = at(2, c.pc) - (c.pc > 7 ? 12 : 0);
      return [
        n(0, 0, 0.5, 'kick', 0.5),
        n(2, 0, 0.5, 'kick', 0.5),
        n(1, 0, 0.5, 'clap', 0.3),
        n(3, 0, 0.5, 'clap', 0.3),
        ...[0.5, 1.5, 2.5, 3.5].map((b) => n(b, 0, 0.25, 'hat', 0.16)),
        n(0, r, 0.5, 'bass', 0.5),
        n(1.5, r + 12, 0.4, 'bass', 0.4),
        n(2, r, 0.5, 'bass', 0.5),
        n(3.5, r + 7, 0.4, 'bass', 0.4),
      ];
    },
  },

  // Late-evening jazz in B flat: walking bass, brushes, soft chords, a vibraphone.
  jazz: {
    bpm: 96,
    beats: 4,
    lead: 'vibe',
    chords: ['Cm7', 'F7', 'Bbmaj7', 'Gm7', 'Cm7', 'F7', 'Bbmaj7', 'Bbmaj7'],
    melody: [
      [[0, 79, 1], [1.67, 82, 0.33], [2, 84, 1.5]],
      [[0, 81, 1], [1.67, 84, 0.33], [2, 81, 2]],
      [[0, 86, 2], [2, 77, 1], [3, 81, 1]],
      [[0, 82, 1.5], [1.67, 86, 0.33], [2, 79, 2]],
      [[0, 84, 1], [1, 82, 0.67], [1.67, 79, 0.33], [2, 75, 2]],
      [[0, 77, 1], [1.67, 81, 0.33], [2, 84, 1], [3, 87, 1]],
      [[0, 86, 3]],
      [],
    ],
    comp: (c, next) => {
      const low = (pc: number) => at(2, pc) + (pc < 4 ? 12 : 0);
      const r = low(c.pc);
      const to = low(next.pc);
      return [
        n(0, r, 0.9, 'bass', 0.5),
        n(1, r + c.iv[1], 0.9, 'bass', 0.45),
        n(2, r + 7, 0.9, 'bass', 0.45),
        n(3, to + (to > r + 7 ? -1 : 1), 0.9, 'bass', 0.45),
        ...c.iv.slice(1).map((i) => n(0, at(3, c.pc) + i + (c.pc < 5 ? 12 : 0), 1.4, 'piano', 0.08)),
        ...c.iv.slice(1).map((i) => n(2.67, at(3, c.pc) + i + (c.pc < 5 ? 12 : 0), 0.8, 'piano', 0.07)),
        ...[0, 1, 1.67, 2, 3, 3.67].map((b) => n(b, 0, 0.2, 'hat', b % 1 ? 0.06 : 0.09)),
        n(1, 0, 0.3, 'brush', 0.14),
        n(3, 0, 0.3, 'brush', 0.14),
      ];
    },
  },
};

/** Every note of one pass through a tune, for tests and for the scheduler. */
export function tuneNotes(id: MusicId): { bar: number; note: Note }[] {
  const t = TUNES[id];
  const cs = t.chords.map(chord);
  return cs.flatMap((c, bar) => [
    ...t.comp(c, cs[(bar + 1) % cs.length]).map((note) => ({ bar, note })),
    ...(t.melody[bar] ?? []).map(([b, midi, dur]) => ({ bar, note: n(b, midi, dur, t.lead, 0.26) })),
  ]);
}

export function tuneLength(id: MusicId): { bars: number; beats: number; bpm: number } {
  const t = TUNES[id];
  return { bars: t.chords.length, beats: t.beats, bpm: t.bpm };
}

const OFF_KEY = 'invitlite-muzica';

/** The guest switched the music off once; keep it off on that phone. */
export function musicOff(win: Window): boolean {
  try {
    return win.localStorage.getItem(OFF_KEY) === 'off';
  } catch {
    return false;
  }
}

export function setMusicOff(win: Window, off: boolean): void {
  try {
    if (off) win.localStorage.setItem(OFF_KEY, 'off');
    else win.localStorage.removeItem(OFF_KEY);
  } catch {
    // private mode: remembered until the page closes
  }
}

export interface Music {
  start(): void;
  stop(): void;
  playing(): boolean;
}

/** Measured in Chrome: this lands the tunes around 0.06-0.08 RMS, under the scene effects. */
const LEVEL = 0.9;

export function music(snd: Pick<Sound, 'ac' | 'bus'>, win: Window, id: MusicId): Music {
  const { ac } = snd;
  const tune = TUNES[id];
  const spb = 60 / tune.bpm;
  const barLen = tune.beats * spb;
  const notes = tuneNotes(id);
  const bars = tune.chords.length;

  const mg = ac.createGain();
  mg.gain.value = 0.0001;
  mg.connect(snd.bus);

  // A small room: a convolver fed with decaying noise.
  const verb = ac.createConvolver();
  const len = Math.floor(ac.sampleRate * 1.8);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  verb.buffer = ir;
  const wet = ac.createGain();
  wet.gain.value = 0.3;
  verb.connect(wet).connect(mg);

  const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const env = (t: number, peak: number, attack: number, decay: number) => {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(mg);
    g.connect(verb);
    return g;
  };
  const osc = (type: OscillatorType, f: number, t: number, end: number, to: AudioNode) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.connect(to);
    o.start(t);
    o.stop(end);
    return o;
  };
  const hiss = (t: number, kind: BiquadFilterType, freq: number, q: number, g: GainNode, len: number) => {
    const s = ac.createBufferSource();
    s.buffer = noise;
    const f = ac.createBiquadFilter();
    f.type = kind;
    f.frequency.value = freq;
    f.Q.value = q;
    s.connect(f).connect(g);
    s.start(t, Math.random() * 0.5);
    s.stop(t + len);
  };

  const play = (x: Note, t: number) => {
    const f = 440 * Math.pow(2, (x.midi - 69) / 12);
    const d = x.dur * spb;
    switch (x.v) {
      case 'piano': {
        const tail = Math.min(d + 0.9, 3);
        const lp = ac.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2600;
        lp.connect(env(t, x.vel, 0.006, tail));
        osc('triangle', f, t, t + tail + 0.1, lp);
        const g2 = ac.createGain();
        g2.gain.value = 0.25;
        g2.connect(lp);
        osc('sine', f * 2, t, t + tail + 0.1, g2);
        break;
      }
      case 'bell': {
        osc('sine', f, t, t + 2, env(t, x.vel, 0.004, 1.8));
        osc('sine', f * 4.01, t, t + 0.5, env(t, x.vel * 0.12, 0.002, 0.35));
        break;
      }
      case 'bass': {
        const lp = ac.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(x.vel, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15);
        g.connect(mg);
        lp.connect(g);
        osc('triangle', f, t, t + d + 0.2, lp);
        break;
      }
      case 'marimba': {
        osc('sine', f, t, t + 0.6, env(t, x.vel, 0.003, 0.45));
        osc('sine', f * 4, t, t + 0.12, env(t, x.vel * 0.3, 0.002, 0.05));
        break;
      }
      case 'vibe': {
        const g = env(t, x.vel, 0.005, Math.min(d + 1.4, 2.6));
        const trem = ac.createGain();
        trem.gain.value = 0.75;
        trem.connect(g);
        const lfo = ac.createOscillator();
        lfo.frequency.value = 5;
        const depth = ac.createGain();
        depth.gain.value = 0.25;
        lfo.connect(depth).connect(trem.gain);
        lfo.start(t);
        lfo.stop(t + 2.8);
        osc('sine', f, t, t + 2.8, trem);
        osc('sine', f * 3, t, t + 0.4, env(t, x.vel * 0.08, 0.003, 0.3));
        break;
      }
      case 'hat':
        hiss(t, 'highpass', 7000, 0.7, env(t, x.vel, 0.002, 0.05), 0.1);
        break;
      case 'brush':
        hiss(t, 'bandpass', 3500, 0.7, env(t, x.vel, 0.02, 0.15), 0.25);
        break;
      case 'clap':
        for (const k of [0, 0.012, 0.024]) hiss(t + k, 'bandpass', 1400, 1.2, env(t + k, x.vel, 0.002, k ? 0.13 : 0.02), 0.2);
        break;
      case 'kick': {
        const o = osc('sine', 120, t, t + 0.3, env(t, x.vel, 0.003, 0.25));
        o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
        break;
      }
    }
  };

  let on = false;
  let bar = 0;
  let barT = 0;
  let timer = 0;
  let stopper = 0;
  const tick = () => {
    while (barT < ac.currentTime + 0.6) {
      for (const x of notes) if (x.bar === bar) play(x.note, barT + x.note.at * spb);
      barT += barLen;
      bar = (bar + 1) % bars;
    }
  };

  return {
    start() {
      if (on) return;
      on = true;
      win.clearTimeout(stopper);
      win.clearInterval(timer);
      if (ac.state === 'suspended') void ac.resume();
      const now = ac.currentTime;
      mg.gain.cancelScheduledValues(now);
      mg.gain.setValueAtTime(0.0001, now);
      mg.gain.linearRampToValueAtTime(LEVEL, now + 2.5);
      bar = 0;
      barT = now + 0.15;
      tick();
      timer = win.setInterval(tick, 90);
    },
    stop() {
      if (!on) return;
      on = false;
      const now = ac.currentTime;
      mg.gain.cancelScheduledValues(now);
      mg.gain.setValueAtTime(Math.max(mg.gain.value, 0.0001), now);
      mg.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      stopper = win.setTimeout(() => win.clearInterval(timer), 700);
    },
    playing: () => on,
  };
}
