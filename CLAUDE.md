# Indian Train — project rules

Original 3D loco-pilot simulator set on Indian railways. Three.js + TypeScript + Vite.
Unofficial game: not affiliated with or endorsed by Indian Railways.

## Layout
- `src/sim/` — pure TypeScript simulation (physics, track, signalling). Never imports Three.js or DOM.
- `src/render/`, `src/ui/`, `src/input/`, `src/audio/` — presentation; reads sim state, never mutates it except through `Controls`.
- `src/content/schema.ts` — zod schemas; `content/**/*.json` — routes, locos, rakes (data-driven, no code changes to add content).
- `tests/` — Vitest unit + scenario tests; `e2e/` — Playwright.
- `docs/` — RESEARCH, ARCHITECTURE, DESIGN, ROADMAP, PROGRESS, ASSET_LICENSES, CONTROLS, ADRs.

## Commands
- `npm run dev` — play locally · `npm test` · `npm run lint` · `npm run typecheck`
- `npm run validate:content` · `npm run perf:sim` · `npm run test:e2e`

## Rules (all agents)
1. **Never invent facts** about Indian Railways rules, signals, figures or timetables. Cite a URL in `docs/RESEARCH.md`/`docs/research/*`; mark uncertain values `approximate` or `UNVERIFIED`.
2. **No trademarks**: no Indian Railways logos, official liveries, or class names in game branding. Use generic names (E-class electric, D-class diesel).
3. **Licensed assets only**: every model/texture/sound/font must be original, procedural, or openly licensed, with a row in `docs/ASSET_LICENSES.md` before it is added.
4. **Determinism**: the sim runs at a fixed 60 Hz step; no `Math.random()`/`Date.now()` inside `src/sim` (use seeded RNG and sim time).
5. **Performance budget**: 60 FPS on integrated GPUs at Medium — prefer instancing, few draw calls, no per-frame allocations in hot loops.
6. No secrets in the repo. Small, tested increments.
7. Every deliverable ends with: what was built, how it was verified, what remains, legal/performance risks.
