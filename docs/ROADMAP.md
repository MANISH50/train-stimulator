# Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Scaffold, agents, docs, research; drivable loco on test section with physics, signals, SPAD, overspeed, station stop, HUD, synth audio, quality presets, perf overlay | **Done** (hooks included) |
| 2 | Full block signalling on the test section, VCD + Kavach-style protection, pre-departure checklist, timetable + report card, tutorial for each rule | Next |
| 3 | AI traffic + dispatcher: priority (superfast > express > passenger > goods), loop-line crossings, holds at the outer signal, cascading delays | |
| 4 | Weather and time of day (fog procedure, monsoon, night with headlights), audio mix, detailed cab interior | |
| 5 | India route map selector; first real corridor from OSM (Geofabrik extract, offline) + Copernicus GLO-30 DEM; regional stations | |
| 6 | Four modes (Intercity, Suburban, Mail/Passenger, Goods), one route each; progression | |
| 7 | Performance pass, accessibility (colour-blind aids, gamepad, subtitles), Tauri desktop builds, CI | |

## Open decisions for the owner
1. **Product name**: research flags legal risk around "Indian Railways"-style names and emblems (docs/research/04 §4). Keep "Indian Train" or pick an original title?
2. **First real route** for Phase 5 (Mumbai suburban, Delhi–Agra, Konkan…).
