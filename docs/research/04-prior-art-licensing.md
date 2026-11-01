# 04 — Prior Art, Data/Asset Licensing, Trademarks, Performance, Packaging

Project: **Indian Train** (Three.js + TypeScript, browser first, Tauri desktop later, 60 FPS target on integrated GPUs).
Research date: 2026-11-01. Not legal advice. Items marked **UNVERIFIED** could not be confirmed from a primary source during this pass.

---

## 1. Existing open-source train simulators

| Project | Stack | License | Reuse code in a closed/proprietary game? |
|---|---|---|---|
| **Open Rails** | C# / XNA-MonoGame, Windows | GPL-3.0-or-later | **No** (copyleft). Ideas and documented file formats only. |
| **OpenBVE** | C#, cross-platform (Mono/.NET) | Core stated public domain; newer code BSD-2; third-party libs mixed (MIT, MS-PL, MPL/GPL/LGPL tri-licence, TOLK LGPL-3) | **Possibly, with care.** Public-domain/BSD-2 parts are permissive, but provenance of older code is admittedly unclear and some deps are LGPL. Treat as idea source; if any code is copied, copy only BSD-2-headed files and keep notices. |
| **Libre TrainSim** | Godot (GDScript) | GPL-3.0(-or-later) | **No** (copyleft; forks must stay GPL). Asset licences not verified (**UNVERIFIED**). |
| **Three.js / Babylon train sims** | — | — | No mature open-source browser train sim found. `sigvef/skog` is a Three.js WebGL demo with a train animation, not a sim. |

Sources: Open Rails GPL — https://open-rails.readthedocs.io/en/1.4/intro.html , https://github.com/openrails/openrails ; OpenBVE — https://openbve-project.net/copyright/ , https://github.com/leezer3/OpenBVE ; Libre TrainSim — https://github.com/Libre-TrainSim/Libre-TrainSim ; skog — https://github.com/sigvef/skog ; topic listing — https://github.com/topics/train-simulator

### Ideas worth borrowing (concepts are not copyrightable; re-implement from scratch)

**OpenBVE**
- *Route format (CSV/RW):* line-based, comma-separated commands built around a fixed **25 m block** along a single "track position" axis, with `$Include` for splitting files. A 1-D chainage-based route description (curves, gradients, signals, structures placed by distance) is an excellent fit for a mainline sim and is far simpler than a full 3-D world graph. RW is legacy; CSV is the recommended dialect. https://openbve-project.net/documentation_hugo/en/routes/csv.html , https://openbve-project.net/documentation/HTML/route_rw.html
- *Route Viewer* as a separate dev tool to validate route files — copy this workflow (a debug route-viewer page in our app).
- *Train definition (train.dat)* separating performance curves, brakes, and cab from 3-D model — good separation of concerns (exact parameters **UNVERIFIED** in this pass).
- *Plugin/safety-system API* (train protection as pluggable module) — maps well to an Indian-style AWS/TPWS/**Kavach** module.

**Open Rails**
- *Timetable mode:* timetables authored in a spreadsheet and saved as Unicode CSV (`.timetable-or`), grouped via `.timetablelist-or`; weather as separate `.weather-or` files. Trains reference named paths. A spreadsheet-editable CSV timetable is ideal for Indian working timetables (WTT) and for community authoring. https://open-rails.readthedocs.io/en/1.4/timetable.html ; GTFS→timetable converter idea: https://github.com/YoRyan/autotable
- *Signalling:* scripted signal logic with per-route signal config (Open Rails `sigcfg`/sigscr; details **UNVERIFIED** in this pass). Lesson: make signal aspect logic data-driven per signalling system, not hard-coded.
- *Physics:* adhesion, multi-unit traction/braking, air-brake pipe propagation, dynamic brake. Use as a checklist of fidelity tiers.
- *Cab UI:* 2-D cab overlays plus 3-D cab, with an on-screen "Track Monitor" / HUD. Good model for an accessible "simple mode" HUD alongside a detailed cab.

**Libre TrainSim**
- Built-in track/route editor in the same engine; scenario/"Exporting and Publishing Content" workflow (wiki). Shows that an in-game editor drives community content. https://github.com/Libre-TrainSim/Libre-TrainSim/wiki

---

## 2. Geographic and timetable data sources

### OpenStreetMap railway tagging (India)
- India wiki (flagged **outdated, needs review**): broad gauge `railway=rail` + `gauge=1676`; metre/narrow `railway=narrow_gauge` + `gauge=1000|762|610`; `usage=main`; `service=spur|siding|yard`; `electrified=contact_line`; `maxspeed` in km/h (wiki suggests assuming 80 if untagged — treat as heuristic only); `network=IR`, `operator=<zone>` (e.g. SR), optional `IR:zone`; stations `railway=station|halt` with `ref=<official station code>`; platforms `ref=CODE:PF#`. https://wiki.openstreetmap.org/wiki/India:Tags/Railway
- Real-world example: a Mumbai–Nagpur way carries `electrified=contact_line`, `voltage=25000`, `gauge=1676`. https://www.openstreetmap.org/way/244796764
- OpenRailwayMap scheme: one way per track; `usage=main|branch|industrial|military|tourism|test|scientific`; `service=yard|siding|spur|crossover`; `maxspeed`, `maxspeed:forward/backward`; `electrified`, `voltage`, `frequency` (0 = DC). Includes India-specific **`railway:kavach`** (values yes/no/version). https://wiki.openstreetmap.org/wiki/OpenRailwayMap/Tagging
- Signals: generic `railway:signal:main=<country-operator prefix>-<type>` scheme (e.g. DE-ESO). **No India prefix/scheme found — UNVERIFIED; assume Indian signal coverage in OSM is sparse.** Plan to place signals procedurally from Indian signalling rules (absolute/automatic block, multiple-aspect colour light) rather than rely on OSM. https://wiki.openstreetmap.org/wiki/Key:railway:signal:main , https://github.com/hiddewie/OpenRailwayMap-vector/blob/master/CONTRIBUTING.md

### ODbL obligations (OSM)
- **Attribution** (OSMF guideline): credit "OpenStreetMap" and make clear the data is under ODbL, ideally linking to openstreetmap.org/copyright. For games it may be on a splash screen, in-game, in credits, or menu; must be legible; if the splash can't link, put the link somewhere easy to find (e.g. a "Data licences" menu entry). https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- **Produced Work vs Derivative Database:** a rendered/visual product (our 3-D world as experienced by players) leans toward *Produced Work*, which may carry any licence (so the game can be proprietary). But you must, on request, offer the underlying **derivative database** (e.g. our processed track/station extract) under ODbL, or the diff/method to recreate it. Extracted data used *as a database* is a Derivative Database. https://osmfoundation.org/wiki/Licence_and_Legal_FAQ , https://wiki.openstreetmap.org/wiki/Open_Data_License/Produced_Work_-_Guideline
- **Games are a grey area:** a 2021 legal-talk thread on OSM-generated game worlds did not reach consensus. Shipping route data files that players/modders can extract increases the chance they are judged a Derivative Database. https://lists.openstreetmap.org/pipermail/legal-talk/2021-February/009059.html
- Practical stance: keep OSM-derived route JSON in a separate, clearly ODbL-licensed data package (publish it or be ready to supply it); keep our original code/art proprietary. Don't mix OSM data with incompatible-licence data in the same database.

### Overpass API usage policy
- Public instance guidance: under ~10,000 queries/day and <1 GB/day is fine for one-off use; for regular use divide by ~100; no parallel scripts; limits apply to the **whole app**, not per user; commercial/regular use should self-host or use paid instances. https://wiki.openstreetmap.org/wiki/Overpass_API , https://community.openstreetmap.org/t/overpass-api-performance-issues/140598/171
- Implication: **never call Overpass from the shipped game client.** Run an offline build pipeline (Geofabrik India `.osm.pbf` extract + osmium/own parser) and ship baked tiles.

### Natural Earth
- Public domain; no permission or credit required (suggested credit "Made with Natural Earth"). https://www.naturalearthdata.com/about/terms-of-use/ , https://en.wikipedia.org/wiki/Natural_Earth
- **India-specific caveat:** default boundaries follow *de facto* control. Natural Earth publishes point-of-view variants including India (`ne_10m_admin_0_countries_ind`). Use the India POV (or Survey of India boundary data) for any national map in the game. https://www.naturalearthdata.com/about/disputed-boundaries-policy/ , https://spatialthoughts.com/2025/10/13/world-map-qgis/
- India's 2021 geospatial guidelines liberalised map making (self-certification) and point to Survey of India boundaries as reference; incorrect depiction of India's external boundary is addressed by the Criminal Law (Amendment) Act 1990 (application to games **UNVERIFIED**). https://www.scconline.com/blog/post/2021/03/04/india-geospatial-data-guidelines-2021/ , https://www.jsalaw.com/articles-publications/india-indias-revised-mapping-policy/

### Elevation: SRTM and Copernicus GLO-30
- **SRTM (NASA/USGS):** US-government public domain; attribution not strictly required but customary ("SRTM data courtesy of NASA/USGS"). https://data.usgs.gov/datacatalog/data/USGS:EROS5e83a3ee1af480c5 , https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- **Copernicus DEM GLO-30:** free worldwide licence incl. commercial use. Unmodified: "© DLR e.V."; modified/derived (our case — resampled terrain): **"produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"** (the long form is used downstream; minimum required wording should be checked in the licence PDF). No liability from providers. Some tiles are withheld from public release (India coverage believed complete — **UNVERIFIED**). https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf , https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30_2024_1
- Avoid FABDEM (derived from GLO-30) — it is CC BY-NC-SA, not usable commercially. https://gee-community-catalog.org/projects/fabdem/

### data.gov.in (GODL-India)
- Government Open Data Licence – India: free reuse **including commercial**, with attribution (provider, source, licence, and a URL/URI); excludes personal/sensitive data, **official names and logos**, and third-party IP; must not imply government endorsement; no liability. Official text page returned HTTP 403 to automated fetch — wording via secondary sources (**partly UNVERIFIED**). https://www.data.gov.in/Godl , https://wiki.openstreetmap.org/wiki/Open_Geospatial_Data_from_Government_of_India , https://atlas.co/data-portals/data-gov-in/
- OSM community considers GODL compatible with ODbL under NDSAP (per OSM wiki).
- Timetable data: catalogue "Indian Railways Train Time Table" exists, but the most-cited resource is a **2015 snapshot** of reservable trains; no current bulk timetable found. https://www.data.gov.in/catalog/indian-railways-train-time-table , https://gist.github.com/sainathadapa/c122ced23381ce81d50cc21b6fc115a0
- Do **not** scrape IRCTC/NTES/third-party railway apps — terms-of-service and database-right risk.

---

## 3. Asset sources

| Source | Licence (verified on site) | Notes |
|---|---|---|
| Poly Haven (HDRIs, textures, models) | CC0 | Can't claim authorship or relicense the raw assets; credit appreciated. https://polyhaven.com/license , https://polyhaven.com/faq |
| ambientCG (PBR materials) | CC0 1.0 | Credit not required; raw files may ship inside a game. https://docs.ambientcg.com/license/ |
| Kenney | CC0 | Credit optional; **Kenney logo not allowed** unless official project. https://kenney.nl/support |
| Quaternius | **Quaternius Asset License (QAL) v1.0** — *not* plain CC0 (older packs were CC0) | Free for commercial games, no attribution; can't resell/redistribute assets themselves or imply endorsement. Record licence per pack downloaded. https://quaternius.com/license.html |
| Freesound | Per-sound: CC0, CC BY (4.0/3.0), CC BY-NC; legacy Sampling+ | **Only CC0 and CC BY** are usable commercially; CC BY needs credit per sound; reject NC and Sampling+. https://creativecommons.org/2011/09/12/celebrating-freesound-2-0-retiring-sampling-licenses/ , https://en.wikipedia.org/wiki/Freesound |
| Sonniss #GameAudioGDC bundles | Sonniss royalty-free licence (v2.0 for downloads from 2026-08-27) | Commercial use, unlimited projects, no attribution; **no redistribution as raw SFX** (incl. asset packs/SDKs/mod kits); **no AI training**; English law. https://sonniss.com/gdc-bundle-license/ |
| Noto Sans / Noto Serif (Devanagari, Bengali, Tamil, Telugu, Gujarati, Gurmukhi, Kannada, Malayalam, Oriya…) | SIL OFL 1.1 | Embed/bundle freely in commercial games; keep the OFL text and copyright notice; can't sell the font alone; modified versions can't use reserved names. https://fontsource.org/fonts/noto-sans-devanagari/about , https://openfontlicense.org/ (UNVERIFIED URL path for OFL text; canonical: https://scripts.sil.org/OFL) |

Note: mod-kit/content SDK distribution would breach Sonniss and Quaternius redistribution clauses — keep those assets inside packed game builds only.

---

## 4. Trademark guidance (Indian Railways)

- Indian Railways is a Government of India organisation. The **Emblems and Names (Prevention of Improper Use) Act 1950** restricts using names/emblems suggesting Government-of-India patronage (Schedule includes "Government of India"; guidelines discourage using "India" in names implying official status). https://indiacode.nic.in/bitstream/123456789/1896/5/A1950-12.pdf , https://www.insightsonindia.com/2025/05/29/emblems-and-names-prevention-of-improper-use-act-1950/
- If the State Emblem (Ashoka lion capital) appears anywhere, the State Emblem of India (Prohibition of Improper Use) Act 2005 applies — never use it (**UNVERIFIED** detail; well-established general rule).
- Precedent: IRCTC sent a copyright/trademark notice to TravelKhana's "IR Catering" app (2015), which was pulled. Russian Railways sued Apple over app icons using its logo (2013). https://spicyip.com/2015/11/travelkhana-lands-in-pickle-sued-for-copyright-and-trademark-infringement-by-irctc.html , https://techcrunch.com/?p=736985
- Indian Railways' heritage logos have been put forward for trademark registration (2021 letter); current IR logo registration status **UNVERIFIED**. GODL also expressly excludes official names and logos.
- **Risk ranking:** (high) IR/IRCTC logos, the "Indian Railways" wordmark as branding, State Emblem, implying official endorsement, using "Official"/"IR" in the title; (medium) exact current liveries with logos (e.g. Vande Bharat branding), specific branded train names ("Rajdhani", "Shatabdi", "Vande Bharat" are names of IR services — **UNVERIFIED** whether registered); (lower) generic loco class designations (WAP-7, WDM-3A), real station names and codes (factual geographic/public information), generic colour schemes without logos.
- **Generic alternatives:** fictional operator ("Bharat Rail Network" style names still risky — prefer something wholly invented, e.g. "Saffron Line Rail"), fictional emblem, "inspired-by" liveries (similar palette, different stripe geometry, no logos), fictional express brands ("Superfast Express 12xxx" pattern is generic). Add a disclaimer: not affiliated with or endorsed by Indian Railways, IRCTC, or the Government of India. The project name "Indian Train" is descriptive; avoid "Indian Railways" in the title/store listing.

---

## 5. Three.js performance for large outdoor worlds on integrated GPUs

**Frame budget:** 60 FPS = 16.67 ms. Practical split on iGPU (rough guidance, not measured): ~2–4 ms JS sim/physics/streaming, ~6–8 ms GPU render, rest headroom for GC/compositor. Measure with `renderer.info.render.calls/triangles` (set `info.autoReset=false` if multi-pass), stats.js, and Chrome Performance/GPU profiler. Community rule of thumb: **< ~100–150 draw calls/frame**; trouble beyond a few hundred on weak GPUs; fill-rate and pixel ratio often matter more than triangles. https://www.utsubo.com/blog/threejs-best-practices-100-tips , https://www.hontran.dev/blog/three-js-performance-optimization

| Technique | Guidance |
|---|---|
| **InstancedMesh** | Default for repeated identical geometry (sleepers, OHE masts, poles, trees, fence posts). One draw call; safest performer. Cull per chunk, not per instance. |
| **BatchedMesh** (r159+, improved r170) | Many *different* geometries sharing one material (station props, buildings). Uses `WEBGL_multi_draw`; falls back to loops without it. Mixed reports (some saw regressions) — profile on target iGPU before adopting. https://discourse.threejs.org/t/how-to-choose-between-instancedmesh-and-batchedmesh/81221 , https://discourse.threejs.org/t/significant-performance-drop-and-high-cpu-usage-with-batchedmesh/67324 |
| **LOD** | `THREE.LOD` for locos/stations; impostors/billboards for far trees; terrain via chunked LOD (quadtree or geomipmapping) with skirts. Track: high-detail rails only near camera (~1–2 km); far track as flat textured ribbon. |
| **Frustum culling** | Automatic per object; merged/instanced objects cull as one bounding volume — so batch **per chunk** to keep culling effective. Recompute bounding spheres for instanced chunks. |
| **Chunk streaming** | Train sims are corridor-shaped: stream chunks along route chainage (e.g. 500 m–1 km tiles), load ahead/unload behind, decode in Web Workers, upload in small per-frame budgets to avoid hitches; dispose geometries/textures explicitly. |
| **Texture compression** | KTX2/Basis Universal stays compressed in GPU memory (crucial on shared-memory iGPUs); call `ktx2Loader.detectSupport(renderer)`. WebP/AVIF save download but expand to RGBA in VRAM. Use texture atlases/arrays to cut material count. https://threejs.org/docs/pages/KTX2Loader.html |
| **Geometry compression** | Meshopt (`EXT_meshopt_compression`) or Draco shrink downloads; meshopt decodes faster. Neither reduces GPU memory unless quantization is kept. Pipeline via gltf-transform CLI (meshopt + KTX2 in one step). |
| **Shadows** | Biggest iGPU cost. Use one directional light with a tight, camera-following shadow frustum (or cascaded only on "High"), shadow only on train + nearby objects, low map size (1024–2048), update every N frames; bake AO/shadows into terrain/building textures; blob shadows under far objects. |
| **Render-on-demand** | Not applicable during driving (continuous motion) but use it for menus, map screens, paused state, and background tabs. Also cap pixel ratio (e.g. `min(devicePixelRatio, 1.5)`) and offer dynamic resolution scaling. |
| **Materials/post** | Prefer `MeshLambert/MeshStandard` with few lights; avoid heavy post (SSAO, SSR); use fog to hide far-plane popping; limit transparent overdraw (vegetation alpha-test, not blend). |
| **WebGPU renderer** | `WebGPURenderer` is the recommended path since ~r171 with automatic WebGL2 fallback (`forceWebGL` for testing); gaps remain on some platforms (e.g. Linux Firefox, older mobile). Stable status of the API surface **UNVERIFIED**. Recommendation: target WebGL2 first via a renderer abstraction; prototype WebGPU/TSL later. https://www.utsubo.com/blog/webgpu-threejs-migration-guide , https://www.buildmvpfast.com/blog/threejs-webgl-to-webgpu-renderer-migration-2026 |

---

## 6. Desktop packaging: Tauri vs Electron

| Aspect | Tauri | Electron |
|---|---|---|
| Installer size | ~3–10 MB (uses OS webview) | ~80–200 MB (bundles Chromium + Node) |
| Runtime memory | Lower idle RAM claimed (30–80 MB vs 150–400 MB) but on Windows still runs Chromium (WebView2), so real gap may be small | Higher |
| Renderer on Windows | WebView2 (Chromium/Edge) — WebGL/WebGL2 behaviour close to Chrome | Bundled, pinned Chromium |
| macOS | WKWebView (WebKit/Safari) — rAF capped at 60 fps; different WebGL/WebGPU support | Same Chromium everywhere |
| Linux | WebKitGTK — lags Chromium features; WebGL performance varies | Same Chromium everywhere |
| Version control | WebView2 evergreen auto-updates (can't pin; can use fixed-version runtime at size cost) | Pin exact Chromium per release |
| Backend | Rust | Node.js |

Sources: https://www.levminer.com/blog/tauri-vs-electron , https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/ , https://www.abratabia.com/native-wrappers/ , https://dev.to/stevepryde/comment/1laf7 , https://docs.rs/tauri-plugin-macos-fps/0.1.0/tauri_plugin_macos_fps/

No controlled FPS benchmark of the same WebGL game on both was found (**UNVERIFIED** performance parity). On Windows (primary Indian PC market) Tauri/WebView2 should perform close to Chrome. Electron gives one consistent renderer across OSes — matters if Mac/Linux become important. Steam-style distribution tolerates Electron's size; Tauri wins for small direct downloads.

---

## Licence table

| Source | License | Allowed use | Attribution text (suggested) | URL |
|---|---|---|---|---|
| OpenStreetMap data | ODbL 1.0 | Commercial OK; Produced Work can be proprietary; derivative DB must be ODbL on request | "Map data © OpenStreetMap contributors, available under the ODbL" (link openstreetmap.org/copyright) | https://osmfoundation.org/wiki/Licence/Attribution_Guidelines |
| Overpass API (public) | Usage policy (not a licence) | Dev/one-off queries only; no client-side use at scale | n/a (data is OSM/ODbL) | https://wiki.openstreetmap.org/wiki/Overpass_API |
| Natural Earth | Public domain | Any use | Optional: "Made with Natural Earth" | https://www.naturalearthdata.com/about/terms-of-use/ |
| SRTM | US Gov public domain | Any use | Customary: "SRTM elevation data courtesy of NASA/USGS" | https://data.usgs.gov/datacatalog/data/USGS:EROS5e83a3ee1af480c5 |
| Copernicus DEM GLO-30 | Copernicus WorldDEM-30 licence (free) | Any use incl. commercial; must credit | "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved" | https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf |
| data.gov.in datasets | GODL-India | Commercial OK; excludes logos/names/personal data; no endorsement | "Contains data from <Ministry/Dept>, data.gov.in, under the Government Open Data License – India (GODL), <dataset URL>" | https://www.data.gov.in/Godl |
| Poly Haven | CC0 | Any use; don't relicense raw assets | Optional: "Assets from Poly Haven (CC0)" | https://polyhaven.com/license |
| ambientCG | CC0 1.0 | Any use | Optional: "<asset> from ambientCG.com, CC0" | https://docs.ambientcg.com/license/ |
| Kenney | CC0 | Any use; no Kenney logo | Optional: "Assets by Kenney (kenney.nl)" | https://kenney.nl/support |
| Quaternius | QAL v1.0 (older packs CC0) | Commercial games OK; no resale/redistribution of assets | Not required; optional "Models by Quaternius" | https://quaternius.com/license.html |
| Freesound | CC0 / CC BY / CC BY-NC / Sampling+ (per file) | Use CC0 and CC BY only | CC BY: "<sound title> by <user> (freesound.org/s/<id>) — CC BY 4.0" | https://freesound.org/help/faq/ |
| Sonniss GDC bundles | Sonniss royalty-free licence v2.0 | Commercial OK; no raw redistribution; no AI training | Not required | https://sonniss.com/gdc-bundle-license/ |
| Noto fonts | SIL OFL 1.1 | Embed/bundle OK; can't sell font alone | Include OFL.txt + "Copyright The Noto Project Authors" | https://github.com/notofonts |
| Open Rails code | GPL-3.0+ | Ideas only for closed game | n/a | https://github.com/openrails/openrails |
| OpenBVE code | Public domain / BSD-2 + mixed deps | Ideas; BSD-2 files copyable with notice | BSD-2 notice if code copied | https://github.com/leezer3/OpenBVE |
| Libre TrainSim code | GPL-3.0+ | Ideas only for closed game | n/a | https://github.com/Libre-TrainSim/Libre-TrainSim |
| three.js | MIT | Any use | Keep MIT notice in third-party licences | https://github.com/mrdoob/three.js |

---

## Recommendations

1. **Do not copy code from Open Rails or Libre TrainSim** (GPL). Re-implement ideas from their public documentation. Treat OpenBVE as reference only unless a file is clearly BSD-2.
2. **Route model:** adopt an OpenBVE-like 1-D chainage route description (blocks along track position with curvature, gradient, speed limits, signals, structures) in our own JSON schema; add an Open Rails-style **CSV timetable** that can be edited in a spreadsheet.
3. **Signalling:** make aspect logic data-driven per system (Indian multiple-aspect colour light, absolute/automatic block, Kavach as a pluggable ATP module). Don't rely on OSM for signals — generate them from rules.
4. **OSM pipeline:** build offline from Geofabrik India extracts (never Overpass at runtime). Ship OSM-derived track/station data as a **separate ODbL data pack** with a source/recreation note; keep code and original art proprietary. Show OSM attribution on splash/credits + a "Data licences" menu.
5. **Terrain:** use Copernicus GLO-30 (with the modified-data credit) as primary DEM, SRTM as fallback; avoid FABDEM (NC). For any India outline/minimap, use Natural Earth India POV or Survey of India boundaries.
6. **Timetables:** use data.gov.in (GODL, with attribution) and hand-authored fictionalised WTTs; avoid scraping IRCTC/NTES.
7. **Assets:** whitelist CC0 (Poly Haven, ambientCG, Kenney), Quaternius (QAL), Freesound CC0/CC BY only, Sonniss (in-build only), Noto (OFL). Keep an `ASSET_LICENCES.csv` per file (source URL, licence, author, attribution text) from day one; generate the credits screen from it. No assets in any future mod SDK unless CC0.
8. **Branding:** no IR/IRCTC logos, State Emblem, or "Indian Railways" in product name or store listing; use a fictional operator, emblem, and "inspired-by" liveries; real station names/codes and loco class designations are lower-risk. Add a non-affiliation disclaimer. Get an Indian IP lawyer review before commercial launch.
9. **Performance:** WebGL2 first behind a renderer abstraction; chunked corridor streaming; InstancedMesh for repeated trackside items; per-chunk batching for culling; KTX2 + meshopt via gltf-transform; one tight shadow cascade around the train; pixel-ratio cap and dynamic resolution; budget < ~100–150 draw calls and verify on an Intel UHD / AMD Vega iGPU early. Revisit WebGPURenderer once the core loop is stable.
10. **Desktop:** Tauri for Windows-first (small installer, WebView2 ≈ Chrome); benchmark the same build in Electron before committing if macOS/Linux parity matters; consider WebView2 fixed-version runtime only if evergreen updates cause regressions.
