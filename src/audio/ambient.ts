// Ambient sound beds for scene zones, all synthesized: city (traffic rumble and horns), farm
// (birdsong), forest (insects and birds), river (rushing water) and hills (wind). Gains follow
// the zone weights at the camera so zones crossfade; inside a tunnel the outside world fades
// and the train's own rumble is boosted by the caller.
import type { AmbientSet } from '../sim/world/zones';

const SETS: AmbientSet[] = ['city', 'farm', 'forest', 'river', 'hills'];

export class Ambient {
  private readonly gains = new Map<AmbientSet, GainNode>();
  private readonly level = new Map<AmbientSet, number>();
  private nextChirp = 0;
  private nextHorn = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    noise: AudioBuffer,
  ) {
    const bed = (type: BiquadFilterType, freq: number, q = 0.7): GainNode => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(out);
      src.start(0, Math.random() * 1.5);
      return g;
    };
    this.gains.set('city', bed('lowpass', 320));
    this.gains.set('farm', bed('highpass', 6000));
    this.gains.set('forest', bed('bandpass', 4800, 6));
    this.gains.set('river', bed('bandpass', 700, 0.9));
    this.gains.set('hills', bed('lowpass', 500));
    for (const s of SETS) this.level.set(s, 0);
  }

  /** Set the mix: weight per ambient set (sums to ~1), 0..1 outside-ness (0 in a tunnel). */
  update(weights: ReadonlyMap<AmbientSet, number>, outside: number): void {
    const t = this.ctx.currentTime;
    const peak: Record<AmbientSet, number> = {
      city: 0.09,
      farm: 0.012,
      forest: 0.03,
      river: 0.06,
      hills: 0.05,
    };
    for (const s of SETS) {
      const w = (weights.get(s) ?? 0) * outside;
      this.level.set(s, w);
      // Wind and insects swell slowly; the city hum is steady.
      const wobble =
        s === 'hills'
          ? 0.6 + 0.4 * Math.sin(t * 0.3)
          : s === 'forest'
            ? 0.7 + 0.3 * Math.sin(t * 2.1)
            : 1;
      this.gains.get(s)!.gain.setTargetAtTime(peak[s] * w * wobble, t, 0.6);
    }
    const birds = (this.level.get('farm') ?? 0) + (this.level.get('forest') ?? 0) * 0.8;
    if (birds > 0.1 && t > this.nextChirp) {
      this.chirp(t, birds);
      this.nextChirp = t + 0.6 + Math.random() * 2.5;
    }
    const city = this.level.get('city') ?? 0;
    if (city > 0.2 && t > this.nextHorn) {
      this.horn(t, city);
      this.nextHorn = t + 3 + Math.random() * 6;
    }
  }

  private chirp(t: number, level: number): void {
    const n = 2 + Math.floor(Math.random() * 3);
    const base = 2600 + Math.random() * 1800;
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      const t0 = t + i * 0.11;
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * 1.35, t0 + 0.06);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.02 * level, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      o.connect(g).connect(this.out);
      o.start(t0);
      o.stop(t0 + 0.1);
    }
  }

  /** Distant road-vehicle horn: two short beeps. */
  private horn(t: number, level: number): void {
    const f = 380 + Math.random() * 160;
    for (let i = 0; i < 2; i++) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      const g = this.ctx.createGain();
      const t0 = t + i * 0.22;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.012 * level, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(lp).connect(g).connect(this.out);
      o.start(t0);
      o.stop(t0 + 0.2);
    }
  }
}
