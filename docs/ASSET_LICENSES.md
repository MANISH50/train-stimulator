# Asset licences

Every model, texture, sound and font must have a row here **before** it is added (CLAUDE.md rule 3).

| Asset | Type | Source | Licence | Attribution |
|---|---|---|---|---|
| Ground, ballast, coach/EMU/wagon/loco liveries (original colour schemes), rain streaks, star field, station board, lineside board and glow textures | Texture (procedural canvas, `src/render/textures.ts`) | Original | Project-owned | — |
| Loco (electric, diesel, EMU), coach, EMU car, open wagon, signal, OHE, station, island platform, tree models, terrain ribbon | Geometry (procedural, `src/render/*.ts`) | Original | Project-owned | — |
| Traction hum, wheel rumble/clatter, brake hiss | Audio (WebAudio synthesis, `src/audio/audio.ts`) | Original | Project-owned | — |
| Dual-tone air horn | Audio (WebAudio synthesis, `src/audio/airHorn.ts`). Pitches (370/466 Hz) are a stylised choice by ear, not measured or sampled from a real horn | Original | Project-owned | — |
| Cab interior, driver's desk, levers and console gauges | Geometry + canvas texture (procedural, `src/render/cabInterior.ts`); generic layout, not a copy of any real loco cab | Original | Project-owned | — |
| Sky shader | Code (`three/examples/jsm/objects/Sky.js`) | three.js | MIT | three.js authors |
| Fonts | System fonts only (Segoe UI; Nirmala UI/Mangal for Devanagari if installed) | OS | Not bundled | — |
| three.js (incl. examples Sky and BufferGeometryUtils) | Library | npm `three` | MIT | three.js authors |
| zod | Library | npm `zod` | MIT | Colin McDonnell |

No third-party binary assets are bundled yet. Planned: Noto Sans/Devanagari (OFL 1.1), CC0 sources (Poly Haven, ambientCG, Kenney) — see docs/research/04-prior-art-licensing.md.

| Crash debris, sparks, dust and smoke, buffer stops; impact, crunch and screech sounds, SPAD alarm | Original, procedural (code in `src/render/crash/`, `src/render/world.ts`, `src/audio/audio.ts`) | Project licence | — |
