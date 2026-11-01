# Indian Train — loco pilot simulator (working title)

An original 3D train-driving simulator set on Indian railways. You drive with the controls a real loco pilot uses: throttle notches, an air brake whose pressure builds and releases realistically, colour-light signals, speed restrictions and platform stops. The game rewards discipline over speed.

> Unofficial fan project. It is not affiliated with or endorsed by Indian Railways. All models, textures and sounds are original or openly licensed (see `docs/ASSET_LICENSES.md`).

## Run it
Requires Node.js 20 or later.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 and press **F1** for the controls. The full key list is in `docs/CONTROLS.md`.

## Phase 1: the Training Ground
- A fictional 4.2 km section with curves and gradients, a temporary 50 km/h restriction, a distant signal, a home signal, and the Prashikshan Nagar platform.
- Deterministic 60 Hz physics:
  - tractive-effort and adhesion limits, with wheel slip
  - Davis resistance, gradient and curve resistance
  - a twin-pipe air brake (BP/BC) whose action reaches the rear of the train with a delay
- Rules: passing a red signal (SPAD) ends the run with a "why this rule exists" card. Overspeed is checked over the whole length of the train, and platform stops report how far you were from the stop mark.
- Chase and cab cameras, Low/Medium/High quality presets (auto-detected), an FPS overlay (F3), and synthesized sound.

## Scripts
| Command | Purpose |
|---|---|
| `npm test` | Unit and scenario tests (physics, SPAD, red-signal wait, speed restriction, content) |
| `npm run test:e2e` | Playwright smoke test on the production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run validate:content` | Check every route/loco/rake JSON against its zod schema |
| `npm run perf:sim` | Headless sim performance check |
| `npm run build` | Production build in `dist/` (no source maps) |

## Docs
`docs/ARCHITECTURE.md`, `docs/RESEARCH.md` (with cited research in `docs/research/`), `docs/DESIGN.md`, `docs/ROADMAP.md`, `docs/PROGRESS.md` and the ADRs in `docs/adr/`. Rules for contributors and AI agents are in `CLAUDE.md`, and the subagents are in `.claude/agents/`.
