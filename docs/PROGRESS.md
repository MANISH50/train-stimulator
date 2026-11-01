# Progress

## 2026-11-01: Phase 1 complete

**What was built**
- Scaffold: Vite + TypeScript + Three.js, ESLint/Prettier, Vitest, Playwright. Also CLAUDE.md, the 12 subagents in `.claude/agents/`, and the hooks in `.claude/settings.json` + `.claude/hooks/`.
- Research: four cited files in `docs/research/`, indexed in `docs/RESEARCH.md`.
- Sim core (`src/sim`):
  - fixed 60 Hz clock
  - track geometry (segments, gradients, curvature)
  - tractive effort with adhesion and slip
  - Davis/grade/curve resistance in kg/t
  - twin-pipe air brake with length-dependent propagation
  - SPAD, overspeed (whole-train limit) and station-stop events
- Content: test-section route, E-class loco and 12-coach rake as JSON, validated with zod.
- Presentation:
  - procedural 3D world: ballast, rails, instanced sleepers, OHE, trees, station with a bilingual name board, speed boards, 4-aspect signals
  - chase and cab cameras
  - HUD: speed, limit, notch, BP/BC, next signal with a text meaning, clock, toasts, SPAD card, controls card
  - synthesized audio
  - quality presets and an FPS overlay

**How it was verified**
- `npm test`: 27 tests pass.
- `npm run lint`, `npm run typecheck` and `npm run validate:content` are clean.
- `npm run perf:sim`: 10k steps take ~13 ms.
- `npm run test:e2e` passes on the production build: renders, drives, no console errors.
- Browser check: a scripted drive shows D1 passed at caution and an overspeed in the TSR while the rear was still inside it. The train waited at red H1, proceeded on yellow, and stopped 14 m short of the platform mark. Running H1 at red showed the SPAD card.
- Each hook script was exercised with sample payloads.

**What remains / known gaps**
- FPS on a real integrated GPU has not been measured: the browser pane was hidden, so frame timing there was not meaningful. Run `npm run dev`, press F3 and read the Medium preset.
- The bundle is ~690 KB (mostly three.js). Code-splitting comes later.
- The `npm audit` dev dependencies report 12 moderate issues (none in runtime deps).
- The repository has no commits yet.

**Risks**
- Product name (docs/research/04 §4).
- Physics tuning values (brake force ratio, brake-signal speed) are calibrated to deceleration ranges, not quoted figures.

## 2026-11-01: camera views and horn

**What was built**
- Four camera views (keys 1–4, C cycles):
  - Cab: pilot view from the seated left-hand position, with a procedural cab interior and driver's console. Speed, BP and BC needle gauges, notch bar, reverser lamps, brake percentages and warning lamps are drawn on a canvas at ~10 Hz. The throttle and brake levers move. Drag to look around.
  - Chase: unchanged.
  - Side: lineside view on the right of the line; drag slides it along the train.
  - Top: straight down, with the track pointing up the screen.
- The HUD instrument panel hides in cab view.
- Synthesized dual-tone air horn: detuned sawtooth bells, soft clip, formants, a pitch rise and air burst at the start, tremolo, and droop on release. It sounds muffled inside the cab.
- Horn-code detector (`src/input/hornCodes.ts`) that names the IRFCA whistle code you sound.

**How it was verified**
- Unit tests: 38 pass, including 11 horn-code tests.
- e2e: 3 pass (drive, the four camera views and the instrument-panel toggle, horn codes).
- Browser screenshots of all four views. Cab gauges matched the sim while moving: 80 km/h, BP 4.3, notch 6/8.
- Cab view draws 150 calls, after merging the shell meshes (164 before).

**What remains**
- The horn sound is unheard by Claude; the owner should listen and tune `BELLS_HZ` in `src/audio/airHorn.ts` if wanted.
- Real FPS on the target laptop is still to be measured.

## Resume here (Phase 2)
1. Pre-departure checklist state machine (brake continuity test: BP 5.0 → 4.0 → Guard vents → 0; research 01 §11).
2. VCD alerter (60 s + 8 s lamp + 8 s buzzer, then emergency) and Kavach-style warn/brake (+2 / +5 km/h).
3. Proper block signalling driven by occupancy instead of timelines; timetable and report card.

## Log
- 2026-11-01T14:25:15.333Z — Claude needs your permission to use ExitPlanMode
