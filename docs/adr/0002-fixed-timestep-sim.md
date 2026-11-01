# ADR 0002 — Deterministic fixed-timestep simulation

**Status:** accepted

**Decision:** The sim steps at exactly 1/60 s, independent of frame rate, using semi-implicit Euler with a dissipative-force cap (resistance and brakes can stop the train but never reverse it). Rendering interpolates between the last two steps.

**Why:** braking distances, SPAD checks and scores must not depend on the player's FPS; replays and scenario tests need identical results for identical inputs (tested in `tests/physics.test.ts`).

**Rules:** no `Math.random`/`Date.now` in `src/sim`; use sim time and seeded RNG. At most 10 steps per frame (long pauses are clamped).
