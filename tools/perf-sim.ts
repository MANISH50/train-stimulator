// Headless performance smoke test: 10k fixed steps of every level, with AI traffic,
// signalling and the dispatcher running, must each stay under budget.
import { LEVELS, levelSetup } from '../src/content/catalog';
import { Sim } from '../src/sim/sim';
import { autopilot } from '../tests/autopilot';

const BUDGET_MS = 400;
const STEPS = 10_000;
let failed = false;
for (const level of LEVELS) {
  const sim = new Sim(levelSetup(level, 'clear'));
  const t0 = performance.now();
  for (let i = 0; i < STEPS && sim.status === 'running'; i++) {
    autopilot(sim);
    sim.step();
    sim.drainEvents();
  }
  const ms = performance.now() - t0;
  const ok = ms <= BUDGET_MS;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'SLOW'} ${level.id.padEnd(10)} ${STEPS} steps in ${ms.toFixed(0)} ms ` +
      `(${((ms / STEPS) * 1000).toFixed(1)} µs/step, budget ${BUDGET_MS} ms)`,
  );
}
process.exit(failed ? 1 : 0);
