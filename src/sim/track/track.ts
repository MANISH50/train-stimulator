import type { RouteDef, SpeedLimit } from '../types';

const STEP_M = 2;

export interface TrackSample {
  x: number;
  y: number;
  z: number;
  /** Heading in radians; 0 = +x, increasing counter-clockwise seen from above (+y). */
  heading: number;
  grade: number;
}

/**
 * A route's track centre-line, pre-sampled every STEP_M metres of chainage.
 * Chainage s runs from 0 to `length`; route chainage = startChainageM + s.
 */
export class Track {
  readonly length: number;
  private readonly xs: Float64Array;
  private readonly ys: Float64Array;
  private readonly zs: Float64Array;
  private readonly hs: Float64Array;
  /** Curve radius per sample, Infinity on straights. */
  private readonly radii: Float64Array;

  constructor(readonly route: RouteDef) {
    this.length = route.segments.reduce((sum, seg) => sum + seg.lengthM, 0);
    const n = Math.floor(this.length / STEP_M) + 2;
    this.xs = new Float64Array(n);
    this.ys = new Float64Array(n);
    this.zs = new Float64Array(n);
    this.hs = new Float64Array(n);
    this.radii = new Float64Array(n).fill(Infinity);

    let x = 0;
    let y = 0;
    let z = 0;
    let h = 0;
    let segIndex = 0;
    let segStart = 0;
    for (let i = 0; i < n; i++) {
      const s = i * STEP_M;
      this.xs[i] = x;
      this.ys[i] = y;
      this.zs[i] = z;
      this.hs[i] = h;
      while (
        segIndex < route.segments.length - 1 &&
        s >= segStart + route.segments[segIndex]!.lengthM
      ) {
        segStart += route.segments[segIndex]!.lengthM;
        segIndex++;
      }
      const seg = route.segments[segIndex]!;
      if (seg.type === 'curve') {
        this.radii[i] = seg.radiusM;
        h += ((seg.turn === 'left' ? 1 : -1) * STEP_M) / seg.radiusM;
      }
      // Heading 0 = +x; positive heading turns toward -z (left when looking along +x with +y up).
      x += Math.cos(h) * STEP_M;
      z -= Math.sin(h) * STEP_M;
      y += this.gradeAt(s) * STEP_M;
    }
  }

  gradeAt(s: number): number {
    let grade = 0;
    for (const g of this.route.gradients) {
      if (g.fromM <= s) grade = g.grade;
      else break;
    }
    return grade;
  }

  radiusAt(s: number): number {
    const i = Math.round(this.clamp(s) / STEP_M);
    return this.radii[i] ?? Infinity;
  }

  /** Lowest applicable speed limit at s, or the given fallback. */
  limitAt(s: number, fallbackKmh: number): SpeedLimit | null {
    let best: SpeedLimit | null = null;
    for (const lim of this.route.speedLimits) {
      if (s >= lim.fromM && s < lim.toM && lim.kmh < (best?.kmh ?? fallbackKmh + 1)) best = lim;
    }
    return best;
  }

  /** Next speed-limit change ahead of s within lookahead, if any. */
  nextLimitAhead(s: number, lookaheadM: number): SpeedLimit | null {
    let next: SpeedLimit | null = null;
    for (const lim of this.route.speedLimits) {
      if (lim.fromM > s && lim.fromM - s <= lookaheadM && (!next || lim.fromM < next.fromM))
        next = lim;
    }
    return next;
  }

  sample(s: number, out: TrackSample): TrackSample {
    const c = this.clamp(s) / STEP_M;
    const i = Math.min(Math.floor(c), this.xs.length - 2);
    const t = c - i;
    out.x = lerp(this.xs[i]!, this.xs[i + 1]!, t);
    out.y = lerp(this.ys[i]!, this.ys[i + 1]!, t);
    out.z = lerp(this.zs[i]!, this.zs[i + 1]!, t);
    out.heading = lerp(this.hs[i]!, this.hs[i + 1]!, t);
    out.grade = this.gradeAt(s);
    return out;
  }

  private clamp(s: number): number {
    return Math.max(0, Math.min(this.length, s));
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function newSample(): TrackSample {
  return { x: 0, y: 0, z: 0, heading: 0, grade: 0 };
}
