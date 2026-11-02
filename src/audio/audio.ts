// Fully synthesized audio (no sample files): traction hum, wheel rumble, brake hiss, air horn,
// SPAD alarm and crash sounds (impact thump and crunch, metal screech while wreckage slides).
import type { CrashSim } from '../sim/crash/crashSim';
import type { AmbientSet } from '../sim/world/zones';
import { Ambient } from './ambient';
import type { Sim } from '../sim/sim';
import { AirHorn } from './airHorn';

/** Stylised rail-joint spacing for the clatter rhythm (game choice, not a track fact). */
const JOINT_SPACING_M = 13;

export class TrainAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private humOsc!: OscillatorNode;
  private humSub!: OscillatorNode;
  private humGain!: GainNode;
  private humFilter!: BiquadFilterNode;
  private rumbleGain!: GainNode;
  private hissGain!: GainNode;
  private horn: AirHorn | null = null;
  private inCab = false;
  private noise!: AudioBuffer;
  private lastJoint = 0;
  private lastBp = 5;
  private ambient: Ambient | null = null;
  /** >1 inside a tunnel: the train's own rumble echoes back. */
  private tunnelBoost = 1;
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private crash: CrashSim | null = null;
  private seenImpacts = 0;

  /** Browsers only allow audio after a user gesture; call from a key/click handler. */
  start(): void {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let seed = 1;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 2147483647) * 2 - 1;
    }

    // Traction motors / transformer hum.
    this.humFilter = ctx.createBiquadFilter();
    this.humFilter.type = 'lowpass';
    this.humFilter.frequency.value = 400;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0.02;
    this.humOsc = ctx.createOscillator();
    this.humOsc.type = 'sawtooth';
    this.humOsc.frequency.value = 50;
    this.humSub = ctx.createOscillator();
    this.humSub.type = 'sine';
    this.humSub.frequency.value = 100;
    this.humOsc.connect(this.humFilter);
    this.humSub.connect(this.humFilter);
    this.humFilter.connect(this.humGain).connect(this.master);
    this.humOsc.start();
    this.humSub.start();

    // Continuous wheel rumble and brake-pipe hiss from looped noise.
    this.rumbleGain = this.loopNoise('lowpass', 180, 0);
    this.hissGain = this.loopNoise('highpass', 3000, 0);

    this.horn = new AirHorn(ctx, this.master, this.noise);
    this.ambient = new Ambient(ctx, this.master, this.noise);
    this.horn.setInCab(this.inCab);
  }

  /** Two-note cab alert chime for important notifications. */
  chime(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = t + i * 0.16;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g).connect(this.master);
      o.start(t0);
      o.stop(t0 + 0.4);
    });
  }

  /** Zone ambience mix and how much of the outside world is audible (0 inside a tunnel). */
  updateWorld(weights: ReadonlyMap<AmbientSet, number>, outside: number): void {
    this.ambient?.update(weights, outside);
    this.tunnelBoost = 1 + (1 - outside) * 1.6;
  }

  /** Two-tone SPAD alarm in the cab while `on`. */
  alarm(on: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (!this.alarmOsc) {
      this.alarmOsc = ctx.createOscillator();
      this.alarmOsc.type = 'square';
      this.alarmOsc.frequency.value = 960;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2500;
      this.alarmGain = ctx.createGain();
      this.alarmGain.gain.value = 0;
      this.alarmOsc.connect(f).connect(this.alarmGain).connect(this.master);
      this.alarmOsc.start();
    }
    const t = ctx.currentTime;
    if (on) this.alarmOsc.frequency.setValueAtTime(Math.floor(t * 4) % 2 ? 770 : 960, t);
    this.alarmGain!.gain.setTargetAtTime(on ? 0.06 : 0, t, 0.02);
  }

  /**
   * Crash sounds for a crash (live or replay): a thump and crunch for each impact, and a
   * screech while wreckage slides. Pass null when there is none.
   */
  updateCrash(crash: CrashSim | null): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (crash !== this.crash) {
      this.crash = crash;
      this.seenImpacts = 0;
    }
    if (!this.screechGain) {
      this.screechFilter = ctx.createBiquadFilter();
      this.screechFilter.type = 'bandpass';
      this.screechFilter.frequency.value = 2600;
      this.screechFilter.Q.value = 9;
      this.screechGain = ctx.createGain();
      this.screechGain.gain.value = 0;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      src.connect(this.screechFilter).connect(this.screechGain).connect(this.master);
      src.start();
    }
    const t = ctx.currentTime;
    if (!crash) {
      this.screechGain.gain.setTargetAtTime(0, t, 0.1);
      return;
    }
    const ring = crash.impacts.length;
    const first = Math.max(this.seenImpacts, crash.impactCount - ring);
    for (let i = first; i < crash.impactCount; i++) this.impact(crash.impacts[i % ring]!.strength);
    this.seenImpacts = crash.impactCount;
    let sliding = 0;
    for (const b of crash.bodies) {
      if (b.onRails || b.asleep || b.invMass === 0) continue;
      sliding = Math.max(sliding, Math.hypot(b.vs, b.vy));
    }
    this.screechGain.gain.setTargetAtTime(Math.min(0.22, sliding / 60), t, 0.08);
    this.screechFilter!.frequency.setTargetAtTime(1900 + sliding * 40, t, 0.1);
  }

  private impact(strength: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const level = Math.min(1, 0.25 + strength);
    // Low thump.
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7 * level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 1);
    // Crunch: filtered noise bursts.
    for (let k = 0; k < 3; k++) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = k === 0 ? 'lowpass' : 'bandpass';
      f.frequency.value = k === 0 ? 900 : 1800 + k * 900;
      const ng = ctx.createGain();
      const t0 = t + k * 0.07;
      const dur = k === 0 ? 1.2 : 0.25;
      ng.gain.setValueAtTime(0.5 * level, t0);
      ng.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(f).connect(ng).connect(this.master);
      src.start(t0, (k * 0.37) % 1.5, dur + 0.05);
    }
  }

  setInCab(inCab: boolean): void {
    this.inCab = inCab;
    this.horn?.setInCab(inCab);
  }

  update(sim: Sim, hornOn: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const v = Math.abs(sim.train.v);
    const notchFrac = sim.controls.notch / sim.consist.loco.notches;
    const load = Math.abs(sim.train.tractionN) / (sim.consist.loco.maxTractiveEffortKN * 1000);

    this.humOsc.frequency.setTargetAtTime(45 + v * 3.2 + notchFrac * 25, t, 0.3);
    this.humSub.frequency.setTargetAtTime(90 + v * 6.4, t, 0.3);
    this.humFilter.frequency.setTargetAtTime(250 + load * 900, t, 0.2);
    const hum = sim.status === 'crashed' ? 0 : 0.02 + load * 0.09;
    this.humGain.gain.setTargetAtTime(hum, t, 0.25);

    this.rumbleGain.gain.setTargetAtTime(Math.min(0.5, (v / 40) * this.tunnelBoost), t, 0.3);

    const bp = sim.train.brakes.bp;
    const venting = bp < this.lastBp - 1e-4;
    this.lastBp = bp;
    this.hissGain.gain.setTargetAtTime(
      venting ? (sim.controls.emergency ? 0.25 : 0.08) : 0,
      t,
      0.1,
    );

    this.horn?.set(hornOn);

    // Wheel clatter: a short thump per bogie pair crossing a joint.
    const joint = Math.floor(sim.train.s / JOINT_SPACING_M);
    if (joint !== this.lastJoint && v > 1) {
      this.lastJoint = joint;
      this.clack(t, Math.min(0.5, v / 30));
      this.clack(t + 2.6 / Math.max(v, 1), Math.min(0.4, v / 35));
    }
  }

  private clack(when: number, level: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level * 0.5, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.07);
    src.connect(bp).connect(g).connect(this.master);
    src.start(when, Math.random(), 0.08);
  }

  private loopNoise(type: BiquadFilterType, freq: number, gain: number): GainNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master);
    src.start();
    return g;
  }
}
