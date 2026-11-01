# Architecture

```
            content/*.json ──zod──► SimSetup
                                       │
keyboard ─► Input ─► Controls ─► Sim (60 Hz fixed step, pure TS)
                                   │  train physics · brakes · track · signals
                                   │  events: SPAD, OVERSPEED, STATION_STOP …
                                   ▼
             FixedClock ─ alpha ─► GameRenderer (Three.js)   Hud (DOM)   TrainAudio (WebAudio)
```

## Layers
| Layer | Folder | Rules |
|---|---|---|
| Simulation | `src/sim` | Deterministic. No Three.js, DOM, `Math.random` or wall clock. ESLint blocks Three.js imports here. |
| Content | `content/`, `src/content/schema.ts` | Every route, loco and rake is JSON validated with zod. Adding content means no code changes. |
| Presentation | `src/render`, `src/ui`, `src/audio` | Reads sim state and never mutates it. |
| Input | `src/input` | Remappable keymap. Writes only to `Sim.controls`. |

## Main loop (`src/main.ts`)
1. `FixedClock.advance(realDt)` returns the number of fixed steps to run (at most 10 per frame) plus an interpolation `alpha`.
2. Run `sim.step()` that many times, then drain the events to the HUD.
3. Interpolate the train front between the last two steps and render.

## Simulation model (Phase 1)
- **Train:** a single rigid mass. Its position is `s`, the chainage of the front.
  - Grade and curvature are sampled at the train's mid-point.
  - Speed limits are checked over the whole train length.
- **Forces:** `src/sim/physics/forces.ts`, following `docs/research/02-train-physics.md`.
- **Air brake:** `src/sim/physics/brakes.ts`.
  - BP at the loco, plus a rake-average BP that lags by train length divided by brake-signal speed.
  - BC follows a first-order lag.
- **Signals:** each signal follows a scripted timeline (`SignalDef.timeline`). Block occupancy and AI traffic replace this in Phase 3.

## ADRs
- [0001 Three.js + TypeScript](adr/0001-threejs-typescript.md)
- [0002 Fixed-timestep deterministic sim](adr/0002-fixed-timestep-sim.md)
