# Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Scaffold, agents, docs, research; drivable loco on test section with physics, signals, SPAD, overspeed, station stop, HUD, synth audio, quality presets, perf overlay | **Done** (hooks included) |
| 2 | Block signalling and station signals (home, starter, loop starter, advanced starter) worked by a dispatcher; dwell and "signal cleared" notifications; timetable line. Still to do: VCD, Kavach-style protection, pre-departure checklist, report card, tutorial | **Partly done** |
| 3 | AI traffic + dispatcher: priority overtakes in station loops, double line with opposing traffic, holds behind other trains | **Done** (cascading-delay timetables still to come) |
| 4 | Weather and time of day: clear, haze, monsoon rain (wet rail), winter fog (signal sighting, caution cap), night (headlight, lamps) | **Done** (weather audio and fog detonators still to come) |
| 5 | India route map selector; first real corridor from OSM (Geofabrik extract, offline) + Copernicus GLO-30 DEM; regional stations | |
| 6 | Five levels (Training, Intercity, Suburban, Mail/Passenger, Goods), each with its own train type; all unlocked | **Done** (progression and scoring still to come) |
| 7 | Performance pass, accessibility (colour-blind aids, gamepad, subtitles), Tauri desktop builds, CI | |

## Open decisions for the owner
1. **Product name**: research flags legal risk around "Indian Railways"-style names and emblems (docs/research/04 §4). Keep "Indian Train" or pick an original title?
2. **First real route** for Phase 5 (Mumbai suburban, Delhi–Agra, Konkan…).
