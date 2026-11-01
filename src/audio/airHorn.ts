// Synthesized dual-tone loco air horn. The two pitches and the voicing are a stylised choice
// made by ear to evoke the dual-tone horns of Indian electric locos — not measured from a
// real horn (see docs/ASSET_LICENSES.md).

/** Two horn bells about a major third apart (F#4 and A#4). */
const BELLS_HZ = [370, 466];
const DETUNE_CENTS = 7;
const ATTACK_S = 0.06;
const PITCH_RISE_S = 0.08;
const PITCH_START = 0.94;
const RELEASE_TAU_S = 0.11;
const RELEASE_DROOP = 0.965;
const LEVEL = 0.16;

export class AirHorn {
  private readonly out: GainNode;
  private readonly env: GainNode;
  private readonly cabFilter: BiquadFilterNode;
  private readonly oscs: { osc: OscillatorNode; base: number }[] = [];
  private on = false;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
    private readonly noise: AudioBuffer,
  ) {
    this.env = ctx.createGain();
    this.env.gain.value = 0;

    // Soft clipping gives the brassy, slightly overdriven air-horn edge.
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClipCurve(2.2);
    // Horn-bell resonances, then tame the top end.
    const formant1 = peaking(ctx, 900, 1.2, 7);
    const formant2 = peaking(ctx, 2300, 2, 5);
    const top = ctx.createBiquadFilter();
    top.type = 'lowpass';
    top.frequency.value = 5200;

    for (const f of BELLS_HZ) {
      for (const detune of [-DETUNE_CENTS, DETUNE_CENTS]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = detune;
        osc.connect(shaper);
        osc.start();
        this.oscs.push({ osc, base: f });
      }
    }

    // Slight tremolo from air pressure flutter.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.04;
    const tremolo = ctx.createGain();
    tremolo.gain.value = 1;
    lfo.connect(lfoDepth).connect(tremolo.gain);
    lfo.start();

    this.cabFilter = ctx.createBiquadFilter();
    this.cabFilter.type = 'lowpass';
    this.cabFilter.frequency.value = 8000;
    this.out = ctx.createGain();
    this.out.gain.value = LEVEL;

    shaper.connect(formant1).connect(formant2).connect(top).connect(this.env);
    this.env.connect(tremolo).connect(this.cabFilter).connect(this.out).connect(destination);
  }

  /** Inside the cab the roof-mounted horn is heard through the body: duller and quieter. */
  setInCab(inCab: boolean): void {
    const t = this.ctx.currentTime;
    this.cabFilter.frequency.setTargetAtTime(inCab ? 1900 : 8000, t, 0.05);
    this.out.gain.setTargetAtTime(inCab ? LEVEL * 0.7 : LEVEL, t, 0.05);
  }

  set(hornOn: boolean): void {
    if (hornOn === this.on) return;
    this.on = hornOn;
    const t = this.ctx.currentTime;
    const g = this.env.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    if (hornOn) {
      g.linearRampToValueAtTime(1, t + ATTACK_S);
      for (const { osc, base } of this.oscs) {
        osc.frequency.cancelScheduledValues(t);
        osc.frequency.setValueAtTime(base * PITCH_START, t);
        osc.frequency.exponentialRampToValueAtTime(base, t + PITCH_RISE_S);
      }
      this.airBurst(t);
    } else {
      g.setTargetAtTime(0, t, RELEASE_TAU_S);
      for (const { osc, base } of this.oscs) {
        osc.frequency.cancelScheduledValues(t);
        osc.frequency.setValueAtTime(osc.frequency.value, t);
        osc.frequency.exponentialRampToValueAtTime(base * RELEASE_DROOP, t + 0.18);
      }
    }
  }

  /** Hiss of air rushing into the horn as the valve opens. */
  private airBurst(t: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(bp).connect(g).connect(this.cabFilter);
    src.start(t, 0.3, 0.2);
  }
}

function peaking(ctx: AudioContext, freq: number, q: number, gainDb: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = 'peaking';
  f.frequency.value = freq;
  f.Q.value = q;
  f.gain.value = gainDb;
  return f;
}

function softClipCurve(drive: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
  }
  return curve;
}
