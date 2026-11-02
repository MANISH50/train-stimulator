# 05 — Scene zones: how the landscape changes along an Indian line

This doc is the research basis for a data-driven "scene zone" system, so a route reads as a real trip.

The pilot route is **fictional** and only *inspired by* a Western Ghats crossing. Real corridors below are **references only**:
- No real station names, timetables or liveries go into the game.
- No class names go into game branding (CLAUDE.md rule 2).

Conventions:
- Every fact carries a URL.
- Enthusiast and encyclopedia sources are labelled.
- Figures that conflict between sources are shown side by side.
- Anything unconfirmed is marked **UNVERIFIED**.
- Items marked *(design)* are our own game choices, not claims about the real railway.

---

## 1. Reference corridors (landscape sequences)

### 1.1 Mumbai–Pune via Bhor (Bhore) Ghat — Karjat to Lonavala
- **Sequence:** Mumbai suburban sprawl, then the coastal plain to Karjat (near sea level), then the ghat climb through Khandala to the Lonavala plateau. Enthusiast source: https://irfca.org/members/sites/apub/tkw/index.htm
- **Suburban density** is extreme. Wikipedia reports peak rakes of "over 4,500 passengers" against a capacity of about 2,000. https://en.wikipedia.org/wiki/Mumbai_Suburban_Railway
- **Rise:** about 1,800 ft (about 550 m) over the original 16-mile (about 19 km) incline. https://wiki.fibis.org/w/Bhore_Ghat_Railway_Construction
  - IRFCA calls it a "28 km incline between Karjat and Lonavala" (the length after realignment; the figures conflict).
  - Wikipedia gives 21 km between Khandala and Palasdari. https://en.wikipedia.org/wiki/Bhor_Ghat
- **Terrain:** a "rugged, steep landscape typical of the western ghats" (IRFCA trip report, 1992).

### 1.2 Kalyan–Kasara–Igatpuri via Thal (Thul) Ghat
- **Approach:** Kalyan to Kasara is 68 km through the outer suburbs; Kasara to Igatpuri over the ghat is 15 km. https://en.wikipedia.org/wiki/Thal_Ghat
- **Suburban reach:** the Central Line's suburban branch runs out to Kasara (67 km). https://en.wikipedia.org/wiki/Mumbai_Suburban_Railway

### 1.3 Konkan Railway (coastal and Western Ghats foothills)
- **Scale:**
  - 738.941 km route
  - 91 tunnels
  - 2,286 bridges (190 major)
  - ruling gradient 1:150 compensated

  Source: https://konkanrailway.com/salient_features
  - Wikipedia gives 756.25 km, 92 tunnels and 2,116+ bridges, which conflicts with KRCL. **Prefer KRCL.** https://en.wikipedia.org/wiki/Konkan_Railway
- **Landscape:** "thickly forested" construction sites, loose soil, and estuaries such as the Mandovi and Zuari (Wikipedia, above).
- **Coastal belt crops (Ratnagiri district):**
  - Lowland: rice, coconut and areca nut
  - Hills: mango and cashew
  - Geology: mainly laterite

  Source: https://ratnagiri.gov.in/geographical-information
- **Ratnagiri crop areas (around 2010–11, dated):** cashew about 88,000 ha, mango about 63,500 ha. https://icar-crida.res.in/CP/Maharastra/BSKKV,%20Dapoli/MH24-Ratnagiri%2004.10.2011.pdf
- **Monsoon:** a monsoon timetable from about 15 June to 20 October. After a 2004 derailment, monsoon speeds were cut from 120 to 75 km/h (Wikipedia, above).

### 1.4 Gangetic plains lines (generic)
- **Landscape:** "the world's largest expanse of uninterrupted alluvium". It is among the most densely populated, intensely farmed regions. https://en.wikipedia.org/wiki/Indo-Gangetic_Plain
- **Crops:** wheat, barley and millet in the drier west; rice in the wetter east (same source).
- **Sugarcane:** Uttar Pradesh has about 46% of national output. https://indiabudget.gov.in/budget2024-25/economicsurvey/doc/stat/tab118.pdf
- **Brick kilns and other lineside industry:** no source found; **UNVERIFIED**.

### 1.5 Rajasthan / Thar desert lines (generic)
- **Landscape:** sandy plains, low eroded hills and wind-blown dunes. Rocky outcrops near Barmer and Jaisalmer. https://en.wikipedia.org/wiki/Thar_Desert
- **Vegetation:** northwestern thorn scrub in "small, scattered green patches", getting denser eastward (same source).
- **Rainfall:** typically 100–300 mm, mostly July–September (same source).
- **Land use:**
  - herding and millets, pulses and sesame
  - canal irrigation (the Indira Gandhi Canal is about 649 km long)
  - solar parks

  Source: same.
- **Khejri** (*Prosopis cineraria*) is a small tree, 3–5 m tall, and the state tree of Rajasthan. https://en.wikipedia.org/wiki/Prosopis_cineraria
- **Mustard:** Rajasthan has about 45% of national rapeseed-mustard output (Economic Survey table, above).

### 1.6 Coastal backwater line — Ernakulam–Alappuzha–Kayamkulam (Kerala)
- **Route:** the line branches at Ernakulam and rejoins the Kottayam route at Kayamkulam. https://en.wikipedia.org/wiki/Ernakulam%E2%80%93Kayamkulam_coastal_line
- **Kuttanad:** canals, coconut groves and paddy, farmed partly below sea level (tourism sources). https://www.incredibleindia.gov.in/en/kerala/alappuzha/backwaters-of-alappuzha
- **The view from the train itself is not documented** (UNVERIFIED).

### 1.7 Mining and Eastern Ghats — Kottavalasa–Kirandul line
- **Scale:** 445 km, mainly carrying "iron ore from Bailadila", with 58 tunnels and 84 major bridges. https://en.wikipedia.org/wiki/Kothavalasa%E2%80%93Kirandul_line
- **Route:** through the Araku Valley and hill sections of the Eastern Ghats (same source). Ruling gradient not stated.

---

## 2. Per-zone visual and audio cues

Facts carry a citation. The colour and sound columns of §6 are *(design)*.

| Zone | What is visible (cited facts) | Typical lineside props | Gaps |
|---|---|---|---|
| Dense city / suburb | Very high density and overcrowded rakes (§1.1). Multi-track corridors and many stations: 150 stations on the Mumbai suburban system (Wikipedia, above). | OHE masts and portals, platforms, foot-over-bridges, boundary walls | Building styles (chawls, mid-rise, informal housing) are **UNVERIFIED** in a citable source |
| Industrial | Workshops, factories and warehouses (the OSM `landuse=industrial` definition). https://wiki.openstreetmap.org/wiki/Key:landuse | Sidings, sheds, tanks, chimneys *(design)* | No IR-specific source |
| Village / farmland | Seasonal fields: kharif June–Oct (rice/paddy, maize, cotton, millets). https://en.wikipedia.org/wiki/Kharif_crop Rabi sown mid-Nov, harvested Apr–May (wheat, barley, mustard, gram). https://en.wikipedia.org/wiki/Rabi_crop | Level crossings with W/L whistle boards (yellow, black letters). https://irfca.org/faq/faq-signal5.html | Village house styles **UNVERIFIED** |
| Sugarcane belt | Tall cane fields, dominant in Uttar Pradesh and Maharashtra (Economic Survey table, §1.4) | — | Cane height and harvest months **UNVERIFIED** |
| Forest (deciduous) | Teak dominates southern, western and central India; sal dominates northern, eastern and central India (IISc India Flora, via search; the page could not be fetched, so **partly UNVERIFIED**). https://indiaflora-ces.iisc.ac.in/veg_types.php The forest-type framework is Champion & Seth (1968). https://complete.bioone.org/journals/international-forestry-review/volume-18/issue-2/146554816818966345/Revisiting-forest-types-of-India/10.1505/146554816818966345.full | Cuttings, retaining walls *(design)* | Bamboo distribution **UNVERIFIED** |
| Plantation / orchard | Konkan mango, cashew, coconut and areca nut (§1.3). Backwater coconut groves (§1.6). | — | — |
| River / bridge | Wide alluvial rivers on the plains (§1.4). Estuaries on the Konkan (§1.3). | Girder bridges, guard rails, "bridge" boards **UNVERIFIED** | — |
| Backwater / coast | Canals, coconut and paddy (§1.6). Konkan coastal paddy (§1.3). | — | — |
| Ghat / tunnel / viaduct | Steep, rugged terrain, tunnels with ventilation shafts, masonry viaducts (§3, §4) | Gradient indicators on catenary masts (IRFCA FAQ, above). Catch sidings (§3). | — |
| Desert / scrub | Dunes, thorn scrub, khejri, millets, canal strips, solar parks (§1.5) | — | — |
| Wetland / delta / mangrove | OSM defines `wetland=mangrove` as a "coastal swamp of salt-tolerant trees". https://wiki.openstreetmap.org/wiki/Key:wetland | — | No IR corridor source found for a delta line (**UNVERIFIED**) |
| Mining | Iron-ore traffic in Eastern Ghats hill country (§1.7). OSM `landuse=quarry` covers surface mineral extraction (Key:landuse, above). | Loading sidings *(design)* | Visual specifics **UNVERIFIED** |

**Sounds.** No authoritative source on lineside ambient soundscapes was found. Every sound in §6 is a *(design)* choice. All sound assets must be CC0 or original, with an ASSET_LICENSES row.

---

## 3. Ghat sections: cited figures

| Item | Figure | Source / confidence |
|---|---|---|
| Bhor Ghat gradient | "1 in 40, with 2 miles of 1 in 37" | FIBIS (historical) https://wiki.fibis.org/w/Bhore_Ghat_Railway_Construction |
| Bhor Ghat gradient (enthusiast) | "1 in 33 in places" | IRFCA 1992 trip report; conflicts with FIBIS, **UNVERIFIED** |
| Thal Ghat gradient | 1 in 37 (Kasara–Igatpuri) | Wikipedia https://en.wikipedia.org/wiki/Thal_Ghat |
| Bhor Ghat tunnels | 25 originally, "two and a half miles" in total (FIBIS); 28 today (Wikipedia Bhor Ghat) | Both sources are cited; the count changed with realignment |
| Longest Bhor Ghat tunnel | No. 26, about 2.6 km, Monkey Hill to Khandala, with ventilation shafts | IRFCA trip report |
| Bhor Ghat viaducts | "eight lofty viaducts" up to 160 ft (about 49 m) | FIBIS |
| Reversing station | Existed on both ghats, later removed by realignment | Wikipedia Bhor Ghat, Thal Ghat; FIBIS |
| Bankers (Bhor) | Rear bankers Karjat to Lonavala; "even a single-coach train" needed one (1992) | IRFCA trip report; current practice may differ (see 03 §24). Vande Bharat climbs without bankers: https://www.deccanherald.com/national/in-a-first-two-vande-bharat-trains-climb-sahyadri-ghats-without-additional-locomotives-1190112 |
| Bankers (Thal) | Wikipedia mentions a rear engine for braking on some descending trains | Wikipedia Thal Ghat; the detail is thin |
| Descent speed (Bhor) | Trains "crawl down the ghats at 50 Km/h" | IRFCA 1992; **approximate, may be outdated** |
| Catch sidings (Bhor) | Three on the descent. Up trains stop at Khandala, Monkey Hill and Thakurwadi/Nagnath, and points stay set for the siding until the stop is made. | IRFCA trip report |
| Konkan ruling gradient | 1:150 compensated | KRCL https://konkanrailway.com/salient_features |
| Konkan monsoon speed | 75 km/h (cut from 120) after 2004 | Wikipedia Konkan Railway |

**Implication for the game:** 1 in 37 is the documented steepest broad-gauge ghat figure. That settles the UNVERIFIED note in 02 §"Ghat sections" (FIBIS gives 1 in 37 for Bhor as a short 2-mile stretch; Wikipedia gives it for Thal). In percent, 1 in 37 is about 2.7% and 1 in 40 is 2.5%.

---

## 4. Bridges, tunnels, viaducts: patterns and spans

**Steel girder spans.** RDSO drawings exist for open web girders of:
- 30.5 m and 45.7 m (DFC sets)
- 61.0 m and 76.2 m (25 t loading)
- 106.7 m

A complete standard span table was not found (**partly UNVERIFIED**). Sources:
- https://rdso.indianrailways.gov.in/uploads/WPSS%20OWG%2061%2C76_2_3(1).pdf
- https://rdso.indianrailways.gov.in/uploads/wpss%20owg%2091_4%2C106_7%2C30_5us%20(1).pdf
- 45.7 m through-type OWG method statement: https://scr.indianrailways.gov.in/uploads/files/1707133826533-BS-125.pdf

**Plate girders.** 18.3 m appears only in a contractor's list (**UNVERIFIED** as a standard).

**Long steel spans.** The Konkan's longest steel span is 124.2 m: an open web through girder over the Zuari and Mandovi. Its longest bridge is 2,065.8 m over the Sharavathi (KRCL salient features).

**Masonry arch viaducts.** The Bhor Ghat has eight, up to about 49 m high (FIBIS, §3). Thal Ghat's Ehegaon viaduct is 219 m long and 55 m high (Wikipedia Thal Ghat).

**Concrete viaduct (Panval Nadi, Konkan):**
- prestressed box girder with 40 m spans and hollow octagonal piers
- about 420–424 m long, built by incremental launching

Sources: https://www.lntecc.com/projects/bridges/panval-nadi-viaduct and https://konkanrailway.com/salient_features
- Height conflicts: KRCL "64 m" (and KRCL's page labels it as the longest viaduct), L&T 60 m.

**Steel arch (modern landmark).** The Chenab bridge is a deck arch:
- 467 m main span
- deck 359 m above the river bed
- opened to rail traffic 6 June 2025

Source: https://en.wikipedia.org/wiki/Chenab_Rail_Bridge

**Tunnels.** Ghat tunnels are short and numerous. Bhor averages roughly 160 m (2.5 miles over 25 tunnels, derived). The long outliers are No. 26 at about 2.6 km and Konkan's Karbude at about 6.5 km (KRCL).

**Pattern for the game *(design)*:**
- plains river: multi-span through-type steel girders of about 30–61 m on piers
- ghat valley: masonry arch viaduct
- short tunnels with portals and, for long ones, ventilation shafts

---

## 5. Open data for later real routes

| Need | Source | Licence | Notes |
|---|---|---|---|
| Land use | OSM `landuse=residential/commercial/industrial/retail/farmland/orchard/forest/quarry/railway/salt_pond/aquaculture` | ODbL (see 04 §2) | https://wiki.openstreetmap.org/wiki/Key:landuse |
| Natural cover | OSM `natural=wood/scrub/grassland/wetland/sand/bare_rock/water/beach/cliff/tree_row` | ODbL | https://wiki.openstreetmap.org/wiki/Key:natural . Treat `natural=wood` and `landuse=forest` as synonyms: data users treat both as "synonymous tags for a wooded area". https://wiki.openstreetmap.org/wiki/Forest |
| Crops | `crop=rice/wheat/sugarcane/rape` on `landuse=farmland` | ODbL | https://wiki.openstreetmap.org/wiki/Key:crop . No mustard value; `rape` is the closest. Indian coverage is likely sparse (**UNVERIFIED**). |
| Wetland | `wetland=mangrove/marsh/swamp/reedbed/saltmarsh/tidalflat` | ODbL | https://wiki.openstreetmap.org/wiki/Key:wetland |
| Land cover (gap-fill) | ESA WorldCover 10 m v200 (2021), 11 classes including cropland, built-up, mangroves | CC BY 4.0 | https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200 , https://registry.opendata.aws/esa-worldcover-vito/index.html |
| Elevation | Copernicus DEM GLO-30 | Free, including commercial; derived-work attribution required | 04 §2, https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf |
| Elevation (alternative) | SRTM | US public domain | 04 §2, https://data.usgs.gov/datacatalog/data/USGS:EROS5e83a3ee1af480c5 |
| Avoid | FABDEM | CC BY-NC-SA | 04 §2 |

**Approach:** classify zones offline from OSM plus WorldCover, then bake them into route JSON. Nothing is fetched at runtime (04 §2).

---

## 6. Recommended zone list for the game *(design)*

The colours are art-direction suggestions. Every sound must be CC0 or original, logged in ASSET_LICENSES.

| Zone id | What to show | Key colours | Ambient sounds |
|---|---|---|---|
| `city_dense` | Mid/high-rise blocks, dense low-rise roofs, multi-track OHE, boundary walls, FOBs, crowded platforms | Concrete grey, faded pastel walls, rust roofs, OHE steel | Traffic hum, horns, station PA chime (generic, no real announcements), crowd murmur |
| `suburb` | Lower-rise housing, small shops, road overbridges, water tanks, scattered trees | Off-white, terracotta, dusty green | Lighter traffic, auto-rickshaw two-stroke, dogs |
| `industrial` | Sheds, chimneys, tanks, sidings, open storage yards | Galvanised grey, oxide red, soot | Machinery drone, distant clank |
| `farmland_kharif` | Flooded or green paddy, bunds, scattered huts, tree rows | Bright green, water reflections, brown bunds | Frogs, birds, wind |
| `farmland_rabi` | Wheat in green to gold, mustard yellow, gram | Yellow `#E8C81E`-ish, wheat gold, khaki soil | Dry wind, crows, distant tractor |
| `sugarcane` | Tall dense cane walls close to the track | Deep green, cane yellow | Rustle |
| `village_lc` | Small houses, a level crossing with gate and W/L board, a cattle path | Ochre, whitewash, board yellow and black | LC bell (generic), cattle, cycle bells |
| `river_bridge` | Wide sandy riverbed, low water, through-girder bridge, ghats/steps on the bank | Sand, slate water, girder grey/green | Hollow girder rumble (track audio), water, birds |
| `forest_deciduous` | Teak or sal-like canopy (seasonal: dry brown or monsoon green), cuttings | Olive, brown leaf litter, laterite red | Cicadas, birds, wind in leaves |
| `plantation` | Mango, cashew and coconut groves on laterite | Dark glossy green, laterite red | Birds, quiet |
| `backwater_coast` | Canals, coconut palms, paddy, small boats | Teal water, palm green | Water lap, distant boat engine |
| `ghat` | Steep cuttings, rock walls, retaining walls, valley drops, waterfalls (monsoon variant), catch siding | Basalt dark grey, monsoon green, mist white | Echo, wind, waterfall (monsoon), loco at full power |
| `tunnel` | Portal, darkness, ventilation-shaft light shafts | Black, sodium/LED lamp pools | Reverb on the loco sound, drips |
| `viaduct` | Masonry arch viaduct across a valley, open views | Stone buff, valley green | Wind, open-air echo |
| `hill_station` | Plateau, small station with sloped roofs, hill-town buildings, mist | Cool greens, red roofs, mist | Birds, light rain, vendors |
| `desert_scrub` | Dunes, thorn scrub, khejri, canal strips, solar arrays | Sand beige, pale sky, sparse olive | Wind, sand hiss |
| `wetland_delta` | Marsh, reedbeds, mangrove edges, embankment track | Grey-green, mud brown | Waders, insects |
| `mining` | Benches, spoil heaps, loading sidings, ore wagons | Iron-ore red, dust haze | Conveyor and machinery, distant blasting horn (generic) |

**Season** *(design)* is a per-route parameter that switches crop zones:
- kharif (Jun–Oct) and rabi (Nov–Apr) use the cited crop calendars
- a `monsoon` flag adds waterfalls and wet materials on ghat/forest zones

---

## 7. Pilot route scene script *(design)* — "Sahyadri Line" (working name)

This is a fictional route of about 24 km. The ghat is compressed: 7 km at a ruling 1 in 40 gives about 175 m of climb, against the real Bhor Ghat's roughly 550 m. The reason is playtime. All station names are fictional and set in the content JSON.

| Km | Zone | Landmark / event | Track notes |
|---|---|---|---|
| 0.0–1.2 | `city_dense` | **Busy city junction station.** 4+ platforms, FOBs, crowds, departing EMU-style traffic | Level; yard speed limits |
| 1.2–4.0 | `city_dense` → `suburb` | Road overbridge, a suburban stop seen passing (no halt) | Gentle 1 in 400 |
| 4.0–5.5 | `industrial` | Goods sidings, sheds, tanks | Level |
| 5.5–8.5 | `farmland_kharif` / `_rabi` (season) | Scattered villages, a level crossing at about km 7.2 with a W/L board | Level, long straight |
| 8.5–9.5 | `village_lc` | **Small halt** at about km 9.0: one short platform, shelter | Level |
| 9.5–10.6 | `farmland` → riverbank | Tree rows, bunds | Gentle 1 in 300 down to the river |
| 10.6–11.0 | `river_bridge` | **River girder bridge:** about 6 × 61 m through-type steel spans (span length cited, §4) | Level on the bridge; bridge speed limit (value **UNVERIFIED**; set as a tuning value) |
| 11.0–14.0 | `forest_deciduous` | Foothills, first cuttings | 1 in 150 rising (Konkan-like ruling grade, §3) |
| 14.0–14.8 | `forest_deciduous` / `ghat` | **Foot-of-ghat loop** (optional banker siding *(design)*, ties to scenario 24/42) | Level loop |
| 14.8–16.0 | `ghat` | Rock cuttings, valley opens to the left | 1 in 40 rising |
| 16.0–16.6 | `tunnel` | **Tunnel 1** (about 600 m, short ghat-type) | 1 in 40, curve |
| 16.6–17.8 | `ghat` | Retaining walls, monsoon waterfall | 1 in 40 |
| 17.8–18.1 | `viaduct` | **Masonry arch viaduct,** about 300 m, about 45 m high (Bhor-like, §3–4) | 1 in 40, curve |
| 18.1–19.3 | `ghat` | Catch siding on the descending side (scenario 39 in 03) | 1 in 40 |
| 19.3–20.8 | `tunnel` | **Tunnel 2** (about 1.5 km, ventilation shafts; nods to Bhor No. 26) | 1 in 50 |
| 20.8–21.8 | `ghat` → `plantation` | Plateau edge, mist | Easing 1 in 100 |
| 21.8–24.0 | `hill_station` | **Hill station** at about km 23.4: sloped roofs, mist, terminus | Level; buffer stop at 24.0 |

**Zone transitions *(design)*:**
- blend over about 200–400 m so props and colour change gradually
- tunnels and bridges are hard boundaries

**Performance note:**
- each zone should map to a small set of instanced prop meshes (CLAUDE.md rule 5)
- stream about 2 zones ahead and 1 behind

---

## Open gaps
- No citable source on building styles (city, suburb, village) or on lineside soundscapes. Treat these as art direction.
- Current Bhor and Thal Ghat speed limits and banker rules: the only sources are 1992 enthusiast material and Wikipedia. Check the working timetable or a current zonal source before writing rule text.
- Bridge speed restrictions, sugarcane season timing and the bamboo/sal/teak exact ranges are **UNVERIFIED**.
- The IISc vegetation page was unreachable (connection refused). Its teak/sal statement comes from a search snippet.
