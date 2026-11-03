# Indian Train — loco pilot simulator (working title)

An original 3D train-driving simulator set on Indian railways. You drive with the controls a real loco pilot uses: throttle notches, an air brake whose pressure builds and releases realistically, colour-light signals, speed restrictions and platform stops. The game rewards discipline over speed.

> Unofficial fan project. It is not affiliated with or endorsed by Indian Railways. All models, textures and sounds are original or openly licensed (see `docs/ASSET_LICENSES.md`).

## Play online
**https://manish50.github.io/train-stimulator/**. It is published automatically from `main` by GitHub Pages.

## Run it
Requires Node.js 20 or later.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 and press **F1** for the controls. The full key list is in `docs/CONTROLS.md`.

## Levels (all unlocked)
1. **Training Ground:** Mail Express. Wait at the red home, stop at the platform, and leave when the starter turns green.
2. **Intercity Express:** Superfast. A slower passenger train is put into a loop so you can overtake.
3. **Suburban Local:** 12-car EMU, four stations 1.5 km apart, with another EMU running ahead.
4. **Mail / Passenger:** you are routed into the Sitapur loop and held until the Superfast behind you passes.
5. **Goods Train:** about 4,700 t of freight on a 1 in 150 climb, looped at Ghatpur while a passenger train overtakes.
6. **Ghat Express (living world, with scenarios):** a fictional 24 km line inspired by Western Ghats crossings. Leave a busy junction through its yard to your booked platform (watch the route indicator and the 30 km/h points), then cross farmland and a river bridge, climb through forest and a ghat with tunnels and a viaduct, and finish at a hill-station terminus. Stations have crowds and trilingual subtitled announcements, and an alarm-chain (ACP) incident tests your response.

Weather: clear, summer haze, monsoon rain (wet rail), winter fog (short signal sighting) or night.

**Accidents (on by default, toggle in the menu):** pass a red signal and you keep going into whatever is ahead. You may rear-end the train in front or be hit at the points by a passing express. Overspeed through loop points derails you, and the Suburban terminus has buffer stops. Crashes are simulated vehicle by vehicle and shown in slow motion, followed by an accident inquiry. Press R to replay from another angle.

**Scenarios (each ends with a short debrief):** an alarm-chain pull, a medical emergency (unscheduled stop), cattle on the line (horn and slow down), a rail fracture ahead (caution speed), a signal held at danger with a crowd building, and a missing-child announcement. Press **V** to turn the assistant loco pilot's signal call-outs on or off. The menu has an optional colour-blind aid.

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

## Deploy
Every push to `main` runs `.github/workflows/deploy-pages.yml`. It tests, lints and type-checks the project, builds with `PAGES_BASE=/train-stimulator/`, and publishes `dist/` to GitHub Pages. If any check fails, nothing is deployed.

One-time setup: in the repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
