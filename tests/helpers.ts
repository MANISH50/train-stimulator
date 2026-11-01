import loco from '../content/locos/e-class.json';
import rake from '../content/rakes/coach-12.json';
import route from '../content/routes/test-section.json';
import { parseLoco, parseRake, parseRoute } from '../src/content/schema';
import { Sim } from '../src/sim/sim';
import type { RakeParams, RouteDef } from '../src/sim/types';

export const LOCO = parseLoco(loco);
export const RAKE = parseRake(rake);
export const ROUTE = parseRoute(route);

/** A flat, straight 20 km route with no limits, signals or stations. */
export function flatRoute(grade = 0): RouteDef {
  return {
    id: 'flat',
    name: 'flat',
    fictional: true,
    startChainageM: 0,
    segments: [{ type: 'straight', lengthM: 20000 }],
    gradients: [{ fromM: 0, grade }],
    speedLimits: [],
    stations: [],
    signals: [],
  };
}

export function makeSim(
  opts: { route?: RouteDef; rake?: Partial<RakeParams>; startS?: number } = {},
): Sim {
  return new Sim({
    route: opts.route ?? flatRoute(),
    loco: LOCO,
    rake: { ...RAKE, ...opts.rake },
    startS: opts.startS ?? 1000,
  });
}

export function run(sim: Sim, seconds: number): void {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) sim.step();
}
