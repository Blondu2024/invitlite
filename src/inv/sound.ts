/**
 * Sound effects for the entrance scenes, synthesised on the spot with Web Audio:
 * no sound files, nothing borrowed, nothing added to the link. The context is
 * only created inside the guest's opening tap (browsers refuse audio before a
 * gesture anyway), it stays quiet when the phone is on silent where the browser
 * allows it, and one button mutes it for good on that phone.
 */

export type SfxName =
  | 'whoosh'
  | 'chime'
  | 'bell'
  | 'flutter'
  | 'projector'
  | 'beep'
  | 'scratch'
  | 'stamp'
  | 'pop'
  | 'puff'
  | 'horn'
  | 'sparkle'
  | 'popper';

export interface Sound {
  play(name: string): void;
  muted(): boolean;
  /** Flips the mute, remembers it, returns the new state. */
  toggle(): boolean;
}

const KEY = 'invitlite-sunet';
const VOLUME = 0.32;

function readMute(win: Window): boolean {
  try {
    return win.localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
}

function saveMute(win: Window, off: boolean): void {
  try {
    if (off) win.localStorage.setItem(KEY, 'off');
    else win.localStorage.removeItem(KEY);
  } catch {
    // private mode: the choice lasts until the page closes
  }
}

type AudioCtor = typeof AudioContext;

export function sound(win: Window): Sound | null {
  const AC = (win as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }).AudioContext ??
    (win as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!AC) return null;
  let ac: AudioContext;
  try {
    // iOS: "ambient" follows the silent switch instead of playing over it.
    const session = (win.navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'ambient';
    ac = new AC();
    void ac.resume?.();
  } catch {
    return null;
  }

  let mute = readMute(win);
  const out = ac.createGain();
  out.gain.value = mute ? 0 : VOLUME;
  out.connect(ac.destination);

  const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const shape = (g: GainNode, t: number, peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  const tone = (f: number, type: OscillatorType, t: number, peak: number, attack: number, decay: number, to?: number) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    const g = ac.createGain();
    shape(g, t, peak, attack, decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
    return o;
  };

  const hiss = (t: number, kind: BiquadFilterType, freq: number, q: number, peak: number, attack: number, decay: number) => {
    const s = ac.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const f = ac.createBiquadFilter();
    f.type = kind;
    f.frequency.setValueAtTime(freq, t);
    f.Q.value = q;
    const g = ac.createGain();
    shape(g, t, peak, attack, decay);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + attack + decay + 0.05);
    return f;
  };

  const chime = (t: number, f: number, peak: number) =>
    [1, 2.76, 5.4].forEach((r, i) => tone(f * r, 'sine', t, peak / (i + 1), 0.004, 2.2 / (i + 1)));

  const sparkle = (t: number) => {
    for (let i = 0; i < 7; i++) tone(2200 + Math.random() * 2200, 'sine', t + i * 0.055, 0.07, 0.003, 0.22);
  };

  const pop = (t: number) => {
    hiss(t, 'lowpass', 3200, 0.7, 0.9, 0.001, 0.09);
    tone(190, 'sine', t, 0.35, 0.002, 0.07, 90);
  };

  const SFX: Record<SfxName, (t: number) => void> = {
    // a breath of air: the veil, the curtain, the envelope
    whoosh: (t) => {
      const f = hiss(t, 'bandpass', 300, 0.9, 0.45, 0.35, 0.6);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
    },
    // two small glass bells, for the rings touching
    chime: (t) => {
      chime(t, 1318.5, 0.22);
      chime(t + 0.13, 1975.5, 0.16);
    },
    // a church bell far away, struck once
    bell: (t) => {
      const parts = [0.5, 1, 1.19, 1.56, 2, 2.51, 3];
      const amp = [0.32, 0.28, 0.16, 0.11, 0.09, 0.05, 0.04];
      parts.forEach((r, i) => tone(330 * r, 'sine', t, amp[i], 0.004, 3.4 - i * 0.35));
    },
    // wings: soft bursts of air
    flutter: (t) => {
      for (let i = 0; i < 12; i++) hiss(t + i * 0.075, 'bandpass', 800 + (i % 3) * 180, 0.8, 0.22 - i * 0.012, 0.01, 0.05);
    },
    // an old projector rattling while the leader runs
    projector: (t) => {
      for (let i = 0; i < 30; i++) hiss(t + i * 0.083, 'highpass', 2600, 0.6, 0.09 + Math.random() * 0.05, 0.002, 0.025);
    },
    beep: (t) => {
      tone(1000, 'sine', t, 0.22, 0.004, 0.13);
    },
    // a nib on paper
    scratch: (t) => {
      let at = t;
      for (let i = 0; i < 16; i++) {
        hiss(at, 'bandpass', 2600 + Math.random() * 1600, 2, 0.08 + Math.random() * 0.05, 0.01, 0.04 + Math.random() * 0.05);
        at += 0.06 + Math.random() * 0.05;
      }
    },
    // a rubber stamp coming down on the register
    stamp: (t) => {
      tone(150, 'sine', t, 0.7, 0.002, 0.24, 48);
      hiss(t, 'lowpass', 700, 0.7, 0.5, 0.002, 0.08);
    },
    pop: (t) => {
      pop(t);
    },
    // blowing out a candle
    puff: (t) => {
      hiss(t, 'lowpass', 900, 0.6, 0.35, 0.03, 0.25);
    },
    // a party blower, two toots
    horn: (t) => {
      [0, 0.32].forEach((d, i) => {
        const o = tone(400, 'sawtooth', t + d, 0.11, 0.03, i ? 0.6 : 0.2);
        o.frequency.exponentialRampToValueAtTime(i ? 540 : 500, t + d + 0.14);
      });
    },
    sparkle: (t) => {
      sparkle(t);
    },
    // a party popper: the bang, then glitter
    popper: (t) => {
      pop(t);
      sparkle(t + 0.06);
    },
  };

  return {
    play(name) {
      const fn = SFX[name as SfxName];
      if (!fn || mute) return;
      try {
        if (ac.state === 'suspended') void ac.resume();
        fn(ac.currentTime + 0.02);
      } catch {
        // a sound that fails must never stop the invitation
      }
    },
    muted: () => mute,
    toggle() {
      mute = !mute;
      saveMute(win, mute);
      out.gain.setTargetAtTime(mute ? 0 : VOLUME, ac.currentTime, 0.02);
      return mute;
    },
  };
}
