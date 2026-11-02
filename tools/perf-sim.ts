// Headless performance smoke test: 10k fixed steps of every level, with AI traffic,
// signalling, the dispatcher and station crowds running, must each stay under budget.
// Each level first gets an untimed warm-up run so the timing reflects steady-state play
// (one-time JIT compilation is not part of the per-frame budget).
import { LEVELS, levelSetup } from '../src/content/catalog';
import { Sim } from '../src/sim/sim';
import { autopilot } from '../tests/autopilot';

const BUDGET_MS = 400;
const STEPS = 10_000;
let failed = false;
const runLevel = (level: (typeof LEVELS)[number], steps: number): Sim => {
  const sim = new Sim(levelSetup(level, 'clear'));
  for (let i = 0; i < steps && sim.status === 'running'; i++) {
    autopilot(sim);
    sim.step();
    sim.drainEvents();
  }
  return sim;
};
for (const level of LEVELS) {
  runLevel(level, 3000);
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
