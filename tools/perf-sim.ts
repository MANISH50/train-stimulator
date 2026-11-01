// Headless performance smoke test: 10k fixed steps of the full sim must stay under budget.
import loco from '../content/locos/e-class.json';
import rake from '../content/rakes/coach-12.json';
import route from '../content/routes/test-section.json';
import { parseLoco, parseRake, parseRoute } from '../src/content/schema';
import { Sim } from '../src/sim/sim';

const BUDGET_MS = 250;
const STEPS = 10_000;
const sim = new Sim({
  route: parseRoute(route),
  loco: parseLoco(loco),
  rake: parseRake(rake),
  startS: 360,
});
sim.controls.indepBrake = 0;
sim.controls.notch = 4;
const t0 = performance.now();
for (let i = 0; i < STEPS; i++) {
  if (sim.status !== 'running') break;
  sim.step();
  sim.drainEvents();
}
const ms = performance.now() - t0;
console.log(
  `${STEPS} sim steps in ${ms.toFixed(1)} ms (${((ms / STEPS) * 1000).toFixed(1)} µs/step, budget ${BUDGET_MS} ms)`,
);
process.exit(ms <= BUDGET_MS ? 0 : 1);
