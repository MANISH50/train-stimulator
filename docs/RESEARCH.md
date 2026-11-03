# Research

Research is split into five files under `docs/research/`. Every fact cites a URL in those files, and anything unconfirmed is marked **UNVERIFIED**. Read the relevant file before you design a rule, scenario or physics change.

| File | Covers |
|---|---|
| [01-signalling-rules.md](research/01-signalling-rules.md) | Colour-light aspects, signal types, block working, SPAD, speed restrictions, fog, level crossings, VCD, Kavach, hand signals, pre-departure brake checks |
| [02-train-physics.md](research/02-train-physics.md) | Tractive effort/adhesion, Davis resistance (kg/t), gradient/curve/tunnel resistance, twin-pipe air brake, reference figures, comfort limits, fixed-step integration |
| [03-scenarios.md](research/03-scenarios.md) | 54 operating scenarios (32 from the brief + 22 new), each with trigger, correct response, penalty, "why this rule exists" text, mode and tier |
| [04-prior-art-licensing.md](research/04-prior-art-licensing.md) | OpenBVE/Open Rails, OSM/ODbL, DEM and open data, CC0 asset sources, trademarks, Three.js performance, Tauri vs Electron |
| [07-yards.md](research/07-yards.md) | Turnout types and speeds (1 in 8.5/12/16, thick-web), crossovers, slips, trap points, sand humps; junction and theatre route indicators, calling-on, shunt, point indicators; interlocking (conflicts, route/approach locking, overlap, standards); junction approach duties; big-junction layouts; recommended yard schema, aspect rules and the pilot-route junction |
| [08-incidents.md](research/08-incidents.md) | Five educational incident scenarios (medical emergency, cattle or person on line, rail fracture, signal failure with platform crowd, missing child): procedure, who does what, Railways Act s.147/s.154, speeds, UNVERIFIED items |
| [05-scene-zones.md](research/05-scene-zones.md) | Landscape sequences on reference corridors (Bhor/Thal Ghat, Konkan, Gangetic plains, Thar, Kerala backwaters, KK line); per-zone visuals and crops by season; ghat gradients, tunnels, bankers, catch sidings; bridge/viaduct spans; OSM/WorldCover/DEM data; game zone list and fictional 24 km pilot scene script |
| [IMMERSION_IDEAS.md](IMMERSION_IDEAS.md) | Ranked immersion backlog; cited station life, porters, PA announcement languages, ACP procedure and Railways Act s.141 (sources C1–C21) |

## What Phase 1 uses
- **Aspects:** RED stop, YELLOW caution, DOUBLE YELLOW attention, GREEN proceed. The lamp stack from the bottom is R, Y, G, Y2 (01 §1).
- **SPAD:** passing a red signal ends the run, matching its treatment as a major violation (01 §4).
- **Speed restrictions:** a restriction applies until the whole train has cleared the termination board (01 §5).
- **Physics:** the equations and parameter table in 02's "Recommended model for the game":
  - Davis resistance in kg/t, plus curve resistance of 0.4 kg/t per degree (D = 1750/R)
  - BP 5.0 kg/cm², full service at 3.5, BC = 2.5 × the BP drop
  - BC max 3.0 for LHB-type coaches
  - semi-implicit Euler integration with a dissipative-force cap

## Decisions the research changed
- **Signals** come from rules and route data, not from OSM: no Indian signal tagging scheme was found (04 §2).
- **Overpass** is used only for offline development; the runtime ships pre-built route data (04 §2).
- **Product name: open risk.** 04 §4 flags the Emblems and Names Act 1950 and IRCTC's 2015 legal notice to a catering app. Avoid "Indian Railways" in the product name and use a fictional operator. Whether "Indian Train" is acceptable is a **decision for the owner** (see ROADMAP).
- **Tuned values:** the brake-signal speed and the brake force ratio are tuning values calibrated to the deceleration targets (0.5–1.0 m/s² for passenger). They are not quoted figures.

## Known conflicts and gaps (to resolve before shipping rule text)
- The rule text cited comes from the older consolidated General Rules on IRFCA. Several rules were amended in 2024, so check against the current rulebook of each depicted zone.
- **Speed past a failed signal on written authority:** sources give 10 vs 15 km/h.
- **Fog cap of 75 km/h:** from a news report.
- **Yellow/double-yellow speed caps:** UNVERIFIED.
- **Missing source text:**
  - RDSO PDFs (Davis coefficients come from a secondary source)
  - the WAP-7 regen curve
  - diesel loco masses
