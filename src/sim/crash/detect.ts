// Contact between two trains' footprints. Every line shares the route chainage, so two trains
// touch when their chainage ranges overlap and, somewhere in that overlap, their lines are
// closer laterally than a vehicle body is wide (same line, or a turnout where they converge).
import type { RailNetwork } from '../track/network';
import { rearS, type Mover } from '../traffic/mover';
import type { CrashKind } from './crashSim';

/** Vehicle body width (m). */
export const BODY_WIDTH_M = 3.2;
const SAMPLE_M = 6;
/** Below this lateral offset between the two tracks at the contact, it is end-on. */
const IN_LINE_M = 1;

export interface Contact {
  s: number;
  /** Lateral position of the contact (midway between the two tracks). */
  y: number;
  /** Lateral distance between the two tracks there. */
  lateralM: number;
}

export function lateralAt(net: RailNetwork, m: Mover, s: number): number {
  return net.offsetAt(net.lineFor(m.dir, m.loopRoutes, s), s);
}

/** First contact between two movers, scanning from a's front, or null. */
export function findContact(net: RailNetwork, a: Mover, b: Mover, out: Contact): Contact | null {
  const aLo = Math.min(a.frontS, rearS(a));
  const aHi = Math.max(a.frontS, rearS(a));
  const bLo = Math.min(b.frontS, rearS(b));
  const bHi = Math.max(b.frontS, rearS(b));
  const lo = Math.max(aLo, bLo);
  const hi = Math.min(aHi, bHi);
  if (lo > hi) return null;
  const n = Math.max(1, Math.ceil((hi - lo) / SAMPLE_M));
  for (let i = 0; i <= n; i++) {
    // From a's front backwards, so the first hit is nearest a's leading end.
    const s = a.dir === 1 ? hi - ((hi - lo) * i) / n : lo + ((hi - lo) * i) / n;
    const ya = lateralAt(net, a, s);
    const yb = lateralAt(net, b, s);
    const lateral = Math.abs(ya - yb);
    if (lateral < BODY_WIDTH_M - 0.2) {
      out.s = s;
      out.y = (ya + yb) / 2;
      out.lateralM = lateral;
      return out;
    }
  }
  return null;
}

/** Name the collision from the trains' directions and how the tracks meet at the contact. */
export function classify(a: Mover, b: Mover, c: Contact): CrashKind {
  if (c.lateralM >= IN_LINE_M) return 'side';
  return a.dir === b.dir ? 'rear-end' : 'head-on';
}
