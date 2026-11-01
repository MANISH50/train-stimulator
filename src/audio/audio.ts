// Fully synthesized audio (no sample files): traction hum, wheel rumble, brake hiss, air horn.
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
    this.humGain.gain.setTargetAtTime(0.02 + load * 0.09, t, 0.25);

    this.rumbleGain.gain.setTargetAtTime(Math.min(0.35, v / 40), t, 0.3);

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
