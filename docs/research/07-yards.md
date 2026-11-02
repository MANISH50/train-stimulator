# 07 - Station approach yards and junction working (research for "Indian Train")

Compiled 2026-11-03. Everything is paraphrased, and any direct quote is under 15 words. Track layouts are described in my own words; no diagrams are copied. **UNVERIFIED** marks anything not confirmed in a primary or reputable source. Source keys follow 01: **[GR]** General Rules on IRFCA, **[IRISET]** IRISET S1 notes, **[IRFCA]** enthusiast FAQ, **[RB]** Railway Board, **[Text]** engineering textbook, **[News]** press.

**Source gaps found while researching.** The IRPWM 2020 PDF and its correction slips could not be read: the official links returned 404, and IRFCA's p-way FAQ returned 403. The turnout speeds below therefore come from a textbook and a JICA report that both cite the IRPWM, plus RB and press material on thick-web switches. Check them against the current IRPWM (a 2024 edition with slips up to Sept 2025 is reported) before any of these numbers goes into rule text.

---

## 1. Track components

### 1.1 Turnouts and permitted speeds (broad gauge)

A turnout is described by its crossing number "1 in N": the larger N is, the flatter the crossing and the faster the turnout can be taken. IR uses 1 in 8.5, 1 in 12, 1 in 16 and 1 in 20 on BG (summary of the [JICA report](https://openjicareport.jica.go.jp/pdf/11866266_02.pdf); the PDF could not be text-extracted, so this is search-summary only).

| Turnout | Switch type | Speed over the turnout side | Source / status |
|---|---|---|---|
| 1 in 8.5 | curved switch | **15 km/h** | [JICA report](https://openjicareport.jica.go.jp/pdf/11866266_02.pdf) (search summary); [Brainkart textbook](https://www.brainkart.com/article/Railway-Engineering--Turnouts_4241/) says 15 km/h was "originally permitted" |
| 1 in 8.5 | straight switch | **10 km/h**, cut from 15 after derailments on turn-in curves | [Brainkart textbook](https://www.brainkart.com/article/Railway-Engineering--Turnouts_4241/) [Text] |
| 1 in 12 | curved switch (conventional) | **30 km/h**, but only on interlocked sections where every turnout a running train may pass is 1 in 12 and locos have speedometers. Otherwise 15 km/h | [Brainkart textbook](https://www.brainkart.com/article/Railway-Engineering--Turnouts_4241/) [Text]; JICA as above |
| 1 in 12 | thick-web tongue rails + cast manganese steel crossing (RDSO drg T-2733) | **50 km/h** | [Brainkart, "Trends in turnout design"](https://www.brainkart.com/article/Trends-in-Turnout-Design-on-Indian-Railways_4242/) [Text] |
| 1 in 12 (loop lines) | thick-web switch (TWS) retrofit | loop speed to rise "from 30 kmph to 50 kmph" | [ETV Bharat, Jul 2024](https://www.etvbharat.com/en/!bharat/thick-web-switches-to-be-installed-at-important-railway-routes-enn24072007457) [News]; an RB Oct 2024 note on loop maintenance was seen in search snippets only (PDF 404) |
| 1 in 16 | curved thick-web on PSC sleepers | 65 km/h | Scribd presentation only. **UNVERIFIED** |
| 1 in 16 / 1 in 20 | CMS, thick web | 50 km/h facing / 75 km/h trailing | IIT-K exam-prep page (seen in search). **UNVERIFIED** |

- **Rulebook override ([GR 4.10](https://irfca.org/docs/rulebook/gr-general.html)):** turnouts and crossovers are capped at **15 km/h** unless approved special instructions allow more. Over non-interlocked facing points the cap is 15 km/h in all circumstances. The turnout-type speeds above therefore apply only where special instructions (Working Time Table, station working rules) permit them.
- **Through an interlocked station** the cap is 50 km/h unless the line is isolated and the interlocking standard allows more ([GR 4.11](https://irfca.org/docs/rulebook/gr-general.html)). See §3.4.
- **Passenger lines:** a slide deck citing IRPWM para 410(2) says passenger running lines should not use crossings sharper than 1 in 12. Status: **UNVERIFIED** against the 2020 text.

### 1.2 Other layout elements

Definitions are general railway terms ([Wikipedia, Railroad switch](https://en.wikipedia.org/wiki/Railroad_switch), sections "Crossover", "Double slip", "Single slip", "Run off"). Any IR-specific detail is cited separately.
- **Crossover:** two turnouts back to back that join two parallel tracks. Its speed is the speed of its turnouts. In the game, each crossover has one speed for its whole length.
- **Scissors crossover:** two crossovers that overlap in an X, with a diamond in the middle. It is compact but has more parts and both crossovers conflict with each other. IR speed: **UNVERIFIED** (assume the turnout speed).
- **Diamond crossing:** two tracks cross on the level with no switching. An IR limit on how flat a diamond may be is **UNVERIFIED**.
- **Single and double slips:** a diamond with switches added, so a train can change tracks inside the diamond's footprint. They are used where space is tight, typically at terminal throats. IR speeds: **UNVERIFIED**.
- **Trap points, sand humps, over-run lines and derailing switches** are IR's ways to *isolate* a loop or siding, so that a vehicle running away on it cannot foul the main line. Derailing switches can be interlocked to set automatically when the adjacent signals clear ([IRFCA interlocking FAQ](https://irfca.org/faq/faq-signal4.html)).
- **Sand hump:** a dead-end spur filled with sand, used as a soft stop for an overrunning train ([IRFCA](https://irfca.org/faq/faq-signal4.html), as an isolation method). Its length and design are **UNVERIFIED**.
- **Dead-end buffer stop:** the end of a terminal platform or siding line. IR design and approach speed: **UNVERIFIED**. The game already treats an impact as an accident (commit 132df17).

## 2. Route indicators and subsidiary signals

### 2.1 Route indicators

- **Purpose:** with a route indicator, one stop signal can serve several lines instead of one signal per line ([IRISET S1 §7.15](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), via 01).
- **Junction (direction) type:**
  - It is a row of five lunar-white lamps set at an angle beside the main signal. It lights only when the route diverges ([RDSO IRS S 66/1984](https://rdso.indianrailways.gov.in/uploads/IRS%20S%2066-84.pdf), seen via search summary: a five-lamp arm per route, for 1 to 6 ways).
  - The arm's angle roughly follows the direction of divergence (secondary sources found in search).
  - When the arm is unlit, the signal applies to the straight (main) route.
  - **UNVERIFIED for IR:** the 45-degree angles and the "position 1-3 left, 4-6 right" numbering. That is UK practice (for example, manufacturer [Unipart Dorman](https://www.unipartdorman.co.uk/route-indicators/)), and IR may differ.
- **Multi-lamp ("theatre") and stencil types:**
  - These show a character, such as a letter or a line or platform number. A multi-lamp unit can show any of nine numerals or letters (secondary).
  - The stencil type is usually fitted to starters (secondary).
- **Which type at what speed:**
  - In MACL territory, routes taken above 15 km/h need the junction type ([IRISET S1 §7.15](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), via 01). Theatre and stencil types are therefore for slow routes, such as platform selection at a terminal or yard entry.
  - One study source gives 25 km/h as the split instead of 15. Status: **UNVERIFIED conflict**. The game uses 15 km/h, following IRISET.
- **Which signals carry them:**
  - Home signals at multi-line stations, just before the diverging points ([IRFCA signal FAQ 2](https://irfca.org/faq/faq-signal2.html)).
  - Routing Home signals ([IRISET S1 §5.2](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
  - Starters, which may carry route indicators or signs to show which line a departing train takes ([IRFCA](https://irfca.org/faq/faq-signal2.html)).
  - Shunt signals for diverging moves ([IRFCA signal FAQ 3](https://irfca.org/faq/faq-signal3.html)).
  - IRFCA says a divergence "should normally also be indicated" by a route indicator.
- **How the main aspect relates to the route:**
  - When the route is set for a line other than the main line, the signal in rear cannot show anything less restrictive than Caution or Attention ([IRFCA](https://irfca.org/faq/faq-signal2.html)).
  - Worked sequence: Distant YY with Home Y means the train is entering the loop and stops at the starter if it is ON ([IRISET S1 §5.4](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), via 01). Double yellow also warns of a turnout ahead ([IRISET S1 §4.19(c)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
  - A Home signal is also set at Caution for permanent or temporary restrictions within station limits ([IRFCA](https://irfca.org/faq/faq-signal2.html)).
- **Route indicator failure:** UK practice is that the main signal is not cleared unless the indicator is proved lit ([railforums thread](https://www.railforums.co.uk/threads/junction-route-indicator-incorrectly-described.264752/), informal). IR behaviour: **UNVERIFIED**.

### 2.2 Calling-on, shunt and point indicators

- **Calling-on signal:**
  - A small yellow light below a stop signal, with a "C" plate. It is unlit when ON.
  - When OFF, it means draw ahead slowly, ready to stop short of any obstruction.
  - It is used to admit a train to an occupied line, for example for coupling, for a long platform, or to wait behind another train.
  - It clears only after the train has stopped.
  - Sources: [IRFCA FAQ 3](https://irfca.org/faq/faq-signal3.html), [IRISET S1 §7.8-7.10](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Shunt signal:**
  - Position light. ON is two white lights horizontal. OFF is two white lights at 45 degrees ([railsigns.uk India](https://railsigns.uk/overseas/india1.html)). IRFCA says the 3-lamp position-light type is the most common on IR.
  - The OFF aspect authorises a shunting move only, normally at 15 km/h or less ([IRFCA FAQ 3](https://irfca.org/faq/faq-signal3.html)).
  - A shunt signal on the same post as a stop signal sits below it, and below any calling-on signal. It cannot be OFF while the stop signal above is OFF ([IRFCA FAQ 3](https://irfca.org/faq/faq-signal3.html)).
- **Point indicator:**
  - A ground target used only where points are not interlocked with signals. It shows white for the main line and, edge-on with a green light, for a divergence ([IRFCA FAQ 3](https://irfca.org/faq/faq-signal3.html)).
  - At an interlocked junction the driver reads the route from the signal and route indicator, not from a point indicator.

## 3. Interlocking principles

1. **Conflicting routes:** signals for conflicting movements cannot be OFF at the same time, and points for conflicting routes cannot be set at once. Locking tables and route-selection tables encode this ([IRFCA FAQ 4](https://irfca.org/faq/faq-signal4.html)).
2. **Route locking:** when a signal is cleared, the facing points on its route are locked. A route goes through selection, locking, holding and release ([IRFCA FAQ 4](https://irfca.org/faq/faq-signal4.html)). In relay practice, route locking (also called back locking) releases section by section behind the train ([railwaysignallingconcepts.in](https://www.railwaysignallingconcepts.in/route-locking-circuit-railway-signalling/), a professional blog [secondary]).
3. **Approach locking:** once a train is on the approach track (secondary source: 1-2 km, about braking distance plus reaction distance), a cleared route cannot be cancelled and its points moved at once. Cancellation releases only after a time delay ("dead approach locking"). Source: same blog [secondary]. The general concept matches the [EULYNX model](https://eulynx.eu/dataprep-2023-03/EARoot/EA2/EA4/EA7/EA8967.htm). IR timer values are **UNVERIFIED**.
4. **Overlap:** the line must be clear beyond the stop signal by 180 m in MACL territory, or 400 m under older 2-aspect working ([IRFCA FAQ 4](https://irfca.org/faq/faq-signal4.html); [GR 8.01](https://irfca.org/docs/rulebook/gr-absolute-block.html), via 01). The points in the overlap are locked as part of the route. A conflicting route through the overlap therefore cannot be set.
5. **Standards of interlocking (older scheme, [IRFCA FAQ 4](https://irfca.org/faq/faq-signal4.html)):**
   - Standard I: through speed limited to 50 km/h.
   - Standard II: through speed limited to 75 km/h, with the main line isolated.
   - Standard III: limited only by the sectional speed, with loops fully isolated.
   - The current scheme is "Standard I(R)-IV(R)" in the IR Signal Engineering Manual (July 2021 edition referenced, para 7.8.9). Exam-prep sources pair the standards with speeds up to 50, 110, 140 and 160 km/h. **UNVERIFIED**: column alignment in the sources is garbled.
6. **Kinds of interlocking:**
   - Panel interlocking, in which points and signals are worked by individual switches, is used at most stations.
   - Route Relay Interlocking (RRI) sets a whole route with one action, at big stations.
   - Electronic Interlocking (EI) is software-driven ([IRFCA FAQ 4](https://irfca.org/faq/faq-signal4.html)).
   - New Delhi's RRI (1999) is reported as the largest in the world ([Wikipedia](https://en.wikipedia.org/wiki/New_Delhi_railway_station)).

## 4. What the loco pilot watches approaching a big junction

- **Distant and Inner Distant aspect:** YY warns of a turnout or a short block ahead. Prepare to take the Home at restricted speed ([IRISET S1 §4.19](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Home signal plus route indicator:** confirm that the lit arm (or the absence of one) matches the expected line. A RAIB report on a UK freight derailment found the driver did not register the route indicator before taking a crossover too fast ([RAIB report 24/2012, Bletchley](https://www.gov.uk/raib-reports/derailment-at-bletchley-junction-bletchley); UK prior art, not IR rule).
- **Speed over the points:**
  - The cap is 15 km/h by default ([GR 4.10](https://irfca.org/docs/rulebook/gr-general.html)), or the turnout speed set by special instructions (§1.1). PSRs over station points are listed in the Working Time Table ([GR 4.08](https://irfca.org/docs/rulebook/gr-general.html)).
  - The restriction lasts until the whole train has cleared the points, consistent with the PSR rule in 01 §5.
  - Exact "turnout speed board" designs at IR points: **UNVERIFIED**. The game reuses the speed indicator and termination boards from 01 §5.
- **Kavach** (where fitted) supervises the loop speed. In a trial it cut speed from 60 to 30 km/h on entering a loop ([PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2022/mar/doc202231424701.pdf), via 01).
- **Platform announcement:** passenger platform allocation is made by the station. A loco-pilot procedure for being told the platform number (walkie-talkie or caution message) is **UNVERIFIED**. The game can present it as an SM radio message, flagged as fiction.
- **Violations:**
  - Overspeeding through a turnout risks derailment. That is why 1 in 8.5 speeds were cut ([Brainkart](https://www.brainkart.com/article/Railway-Engineering--Turnouts_4241/)).
  - A wrong route is primarily an interlocking or signal failure. In the June 2023 Bahanaga Bazar accident, a train given a main-line signal ran into the loop and hit a standing goods train; the CRS blamed faulty signal-circuit alteration ([The Wire](https://thewire.in/government/commissioner-of-railway-safety-signaling-operations-staff-balasore-tragedy)) [News]. A similar loop-line collision at Kavaraipettai in Oct 2024 was later reported as sabotage ([Deccan Herald](https://www.deccanherald.com/india/sabotage-led-to-bagmati-express-train-accident-in-tamil-nadu-finds-crs-probe-3656554)) [News].
  - Game lesson: the pilot cannot always prevent a wrong route. Scoring must not blame the player for an injected interlocking fault, but should reward an early brake when the route indicator disagrees with the expected route.
  - Formal IR penalties for exceeding turnout speed: **UNVERIFIED**.

## 5. Typical big-junction and suburban-hub layouts (own description)

- **Scale examples:**
  - New Delhi has 16 platforms and 20 tracks ([Wikipedia](https://en.wikipedia.org/wiki/New_Delhi_railway_station)).
  - Howrah, a terminus, has 24 platforms in two complexes and 25 tracks ([Wikipedia](https://en.wikipedia.org/wiki/Howrah_railway_station)).
  - Kalyan, a suburban junction, has 8 active platforms. Slow locals use platforms 1/1A, and express and fast locals use platforms 4-7 in up/down pairs on shared island bases ([Wikipedia](https://en.wikipedia.org/wiki/Kalyan_Junction_railway_station)).
- **General pattern (my synthesis, not from one source):**
  - A through junction has an up main and a down main through the centre.
  - It has platform loops on each side, often island platforms between pairs of lines.
  - Goods or avoiding lines run on the outside.
  - At each end, a crossover ladder fans out from the mains: a chain of crossovers that each step one track sideways, so any approach line can reach any platform line.
  - Where a branch diverges, there is a junction beyond the station throat, sometimes a flyover in suburban areas, to avoid conflicting crossings.
  - Suburban hubs pair lines by speed (slow and fast corridors) rather than by direction alone. Kalyan's platform use reflects that pattern.
- **Use of OpenStreetMap:** OSM track geometry (`railway=rail`, `service=siding|yard|crossover`) can be used to study real throats ([OSM wiki](https://wiki.openstreetmap.org/wiki/Tag:railway%3Drail)). This is ODbL data: shipped content must be original layouts "inspired by", not traced copies, unless attributed per 04 §2.

---

## Recommended yard model for the game

### Data schema (extends the existing `lines[].offsets` in `src/content/schema.ts`)

- **`lines[]`** (existing): each track is a line parallel to the route chainage, with a lateral offset in metres from the reference line (for example UP main at 0, DN main at +5.3, loops at ±10.6).
  - Track-centre spacing is a tuning value. IR minimum BG track centres (often quoted as 4.265 m, or 5.3 m for new works) are **UNVERIFIED**.
- **`crossovers[]`** (new): `{ id, fromLine, toLine, startM, endM, turnout: "1in8.5"|"1in12"|"1in12TW"|"1in16", speedKmh, facingFor: dir }`.
  - The two lines must be adjacent, meaning their offsets are next to each other at `startM`.
  - `speedKmh` defaults from the turnout table: 1 in 8.5 gives 15, 1 in 12 gives 30, 1 in 12 thick-web gives 50, 1 in 16 gives 50 (**UNVERIFIED**, see §1.1).
  - A route-level `specialInstructions: false` forces the GR 4.10 default of 15 km/h.
  - Validation: the length `endM - startM` must be at least a minimum per turnout type (tuning value), and crossovers must not overlap on the same line.
- **`routes[]`** (new): `{ id, entrySignal, exitSignal, lines: [lineId…], crossovers: [xoId…], kind: "main"|"loop"|"platform"|"goods"|"shunt"|"calling-on", indicator?: { type: "junction", arm: 1..6 } | { type: "theatre", text: "3" }, overlapM: 180 }`.
  - The route's speed is the minimum of the line speeds and its crossover speeds.
- **Conflicts** (derived when content is loaded, not authored):
  - Two routes conflict if they share a line segment (including the overlap), share a crossover, or use crossovers that cross each other (the two halves of a scissors, or a diamond).
  - Precompute a conflict bitset per route at load time, so that clearing a route needs no allocation per frame.
- **Locking in the sim:**
  1. Route request.
  2. Check conflicts against locked routes.
  3. Lock the route's crossovers in position.
  4. Clear the signal.
  5. Approach-lock as soon as a train is within the approach length; cancelling then starts a time delay (tuning value, **UNVERIFIED** IR figure).
  6. Release crossovers section by section once the train's tail passes.
  - This fits the existing interlocking and its next-signal cache (commit 3626ff1).

### Aspect rule per route kind

| Route kind | Entry (Home) aspect | Indicator | Signal in rear | Speed enforced |
|---|---|---|---|---|
| Main, run-through | G (needs starter and advanced starter OFF) | none | G | line speed; 50 km/h cap unless the station is isolated and the standard allows more ([GR 4.11](https://irfca.org/docs/rulebook/gr-general.html)) |
| Main, stopping | Y | none | G or YY per block state | line speed, stop at the starter |
| Loop / diverging platform | **Y at most** (never G) | junction arm lit | YY at most | crossover speed until the tail clears ([IRFCA](https://irfca.org/faq/faq-signal2.html), [IRISET §5.4](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)) |
| Terminal or slow platform selection (≤15 km/h) | Y | theatre number | YY | 15 km/h ([IRISET §7.15](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)) |
| Occupied line | main R plus calling-on yellow, after the train stops | optional | Y | on-sight, low cap (01 §2) |
| Shunt | main R plus shunt position light | optional | n/a | at most 15 km/h ([IRFCA FAQ 3](https://irfca.org/faq/faq-signal3.html)) |

### Proposed junction approach for the pilot route

This is a fictional junction. It is not a copy of any real station.

- **Lines:**
  - Four platform lines: PF1 is the UP loop, PF2 the UP main, PF3 the DN main and PF4 the DN loop. PF1 and PF2 share an island, as do PF3 and PF4.
  - One outer goods line, isolated from the UP loop by a trap point and sand hump (§1.2).
- **Two crossover ladders:**
  - The entry ladder lies between the Home and the platforms. It has three 1-in-12 crossovers: UP main to UP loop, UP main to DN main, and UP loop to goods line.
  - The exit ladder lies beyond the platforms, before the Advanced Starter.
- **Crossover speed:** **30 km/h** (conventional 1-in-12 curved switch, [Brainkart](https://www.brainkart.com/article/Railway-Engineering--Turnouts_4241/) / JICA; valid only under special instructions, per GR 4.10). A later "upgraded yard" level can use 50 km/h thick-web switches ([Brainkart 4242](https://www.brainkart.com/article/Trends-in-Turnout-Design-on-Indian-Railways_4242/), [ETV Bharat](https://www.etvbharat.com/en/!bharat/thick-web-switches-to-be-installed-at-important-railway-routes-enn24072007457)).
- **Signals, in order of approach:**
  - Distant.
  - Home with a junction-type route indicator: arm 1 lit for the UP loop (PF1), arm 4 for the crossover to the DN main or PF3 (arm numbering is the game's convention, **UNVERIFIED** for IR), unlit for the UP main (PF2).
  - A calling-on signal below the Home.
  - A starter per platform line, each with a shunt signal.
  - Advanced Starter at least 120 m beyond the outermost points ([IRISET §5.3(b)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), via 01).
- **Overlap:** 180 m beyond each starter, with the points in it locked.
- **Scenario hooks:**
  1. Routed to the loop: distant YY, home Y plus arm, 30 km/h over the ladder.
  2. Run-through on the main: G G G, 50 km/h cap if the station is not isolated.
  3. Calling-on into an occupied PF1.
  4. Injected wrong-route fault (the arm disagrees with the briefing): the player is scored on reacting, not blamed for the fault.
- **Performance:** the yard adds about 4-8 crossovers and 8-12 routes per station. Conflict checks run as precomputed bitsets, and the rails render as instanced or merged geometry. Both fit the CLAUDE.md budget.

## Uncertain / needs verification

1. All turnout speeds in §1.1 against the current IRPWM (2020 or 2024 edition and its slips). In particular 1 in 16, and the 1 in 12 30 km/h conditions.
2. The current RB circular on 50 km/h loop lines with thick-web switches (only the press report and search snippets were seen).
3. Junction indicator arm angles and numbering on IR, and the 15 vs 25 km/h split between theatre and junction types.
4. Speed values for the Standard I(R)-IV(R) interlocking standards (IRSEM 2021).
5. IR approach-locking timers and approach-track length.
6. Scissors, slip and diamond speeds; sand hump and buffer stop design.
7. IR track-centre spacing; turnout speed board design; how the loco pilot is told the platform number.
