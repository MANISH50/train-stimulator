# 03 - Operational Scenarios for "Indian Train"

Research date: 2026-11-01. Purpose: give the design team real-world loco-pilot (LP) scenarios from Indian Railways (IR), with the correct response as documented, a suggested game penalty, and a one-line educational tooltip.

**Read this first**
- "Correct response" text is paraphrased from the sources cited. Where a source is a news report, a zonal circular, or a secondary summary, that is noted. Anything I could not confirm against a rule text is tagged **UNVERIFIED**. No rules have been invented. Where IR practice is not published, the card says so.
- "Penalty" lines are **game-design suggestions only**. They are not IR disciplinary rules.
- Speeds and distances vary by zone, section, gauge and the year of the rule. The game should treat the numbers below as defaults that can be tuned per route, not as universal law. Real sections carry their own limits in the Working Time Table (WTT) and Subsidiary Rules (SR).
- Modes: **IC** = Intercity Express, **SL** = Suburban Local, **MP** = Mail/Passenger, **GD** = Goods. Tier 1 = intro, 2 = intermediate, 3 = advanced.

## Source key

| Key | Source | Type |
|---|---|---|
| S1 | IRFCA extract of General Rules (GR) Ch. IV, "Working of trains generally" - https://irfca.org/docs/rulebook/gr-general.html | Rule text (extract) |
| S2 | IRFCA extract of GR Ch. IX, "Automatic block system" - https://irfca.org/docs/rulebook/gr-automatic-block.html | Rule text (extract) |
| S3 | IRFCA extract of GR Ch. VI, "Accidents and unusual occurrences" - https://irfca.org/docs/rulebook/gr-accidents.html | Rule text (extract) |
| S4 | IRFCA extract of GR Ch. XVI, "Level crossings" - https://www.irfca.org/docs/rulebook/gr-lc.html | Rule text (extract) |
| S5 | IRFCA FAQ "Railway Operations II" - https://irfca.org/faq/faq-ops2.html | Enthusiast reference |
| S6 | IRFCA "Caution Orders" - https://irfca.org/docs/caution-orders.html | Enthusiast reference |
| S7 | Fog speed 75 km/h with fog device - https://www.thenewsminute.com/news/railways-increases-max-speed-trains-75-kmph-combat-delays-170656 ; NR winter drive 2025 - https://www.etvbharat.com/en/bharat/indian-railways-rolls-out-winter-safety-drive-to-combat-fog-hazards-enn25110504154 | News |
| S8 | IEEE paper on Automatic Switched Neutral Section - https://ieeexplore.ieee.org/document/9342139 | Academic |
| S9 | Elephant corridors: Parliament answer - https://eparlib.nic.in/bitstream/123456789/2979792/1/AU2556_2F7PHc.pdf ; Rajdhani night incident - https://www.freepressjournal.in/viral/rajdhani-express-loco-pilots-avert-elephant-collision-on-assam-railway-tracks-video ; Madras HC / 45 km/h - https://www.nationalheraldindia.com/amp/story/national/railways-to-madras-hc-not-possible-to-reduce-speed-of-trains-to-prevent-elephant-deaths | Govt / News |
| S10 | Kanchanjunga Express CRS probe (2024) - https://www.onmanorama.com/news/india/2024/07/17/kanchanjunga-express-accident-probe-report.html ; https://www.tribuneindia.com/news/india/signal-failure-among-lapses-to-blame-for-kanchanjunga-train-mishap-probe-640475 | News on CRS report |
| S11 | SCR Fly Leaf 2/2024 (hot axle thresholds) - https://scr.indianrailways.gov.in/cris//uploads/files/1713438157251-Fly%20Leaf%20No.%202%20of%202024.pdf | Zonal circular |
| S12 | Alarm chain pulling: https://www.thenewsminute.com/article/incidents-people-pulling-alarm-chains-trains-frivolous-reasons-rise ; https://curlytales.com/india/trending/indian-railways-alarm-chain-rules-when-can-you-pull-it-and-whats-the-penalty/ | News |
| S13 | Konkan Railway monsoon 2026 release - https://konkanrailway.com/en/node/7036 | Operator release |
| S14 | Railway Board summer precautions letter, 29-02-2024 - https://indianrailways.gov.in/railwayboard/uploads/directorate/civil_engg/2024/(PCE-%20All%20Zonal%20Railways)%20Summer%20Pracaution%20Dated%2029022024.pdf ; SCR Fly Leaf 4/2025 - https://scr.indianrailways.gov.in/cris//uploads/files/1744367759519-Fly%20Leaf%20No.%2004%20of%202025.pdf | Board letter / zonal |
| S15 | SCR Fly Leaf 2/2025 (VCD, crew precautions) - https://scr.indianrailways.gov.in/cris//uploads/files/1743053135197-Fly%20Leaf%20No.%2002%20of%202025.pdf ; Breath-analyser RTI report - https://www.newslaundry.com/2025/11/20/indias-trains-are-running-on-luck-rti-points-to-rampant-drunk-train-driving | Zonal / News |
| S16 | Stone pelting: https://www.onmanorama.com/travel/travel-news/2025/09/18/railways-to-tighten-crackdown-on-stone-pelting-incident.amp.html ; https://patnapress.com/?p=24335 | News |
| S17 | SCR Fly Leaf 7/2024 (OHE abnormality reporting to TPC) - https://scr.indianrailways.gov.in/cris//uploads/files/1731666198748-Fly%20Leaf%20No.%207%20of%202024.pdf | Zonal circular |
| S18 | Coach fire: Garib Rath 2025 - https://www.theweek.in/news/india/2025/10/18/how-loco-pilot-averted-tragedy-after-flames-engulfed-amritsar-saharsa-garib-rath-express-coach-in-punjab.html ; SCR safety bulletin Jul-Aug 2023 - https://scr.indianrailways.gov.in/cris//uploads/files/1698905825127-Bi-Monthly%20Safety%20Bulletin%20Jul%20&%20Aug%202023.pdf | News / Zonal |
| S19 | Flooded bridges: Godavari - https://deccanchronicle.com/nation/current-affairs/150722/cwc-alerts-railways-on-godavari-flood-level.html ; Yamuna - https://outlookindia.com/national/27-trains-cancelled-7-diverted-after-delhis-yamuna-bridge-closes-due-to-high-wat-news-314198 | News |
| S20 | Duty hours: https://scroll.in/article/1071603/the-harrowing-life-of-a-loco-pilot-no-time-to-eat-and-sleep ; HOER summary - https://mycbt.in/blogs/hoer-rules-2005-complete-guide-to-railway-hours-of-employment-rest-rules | News / Secondary |
| S21 | Cattle run-over measures - https://news.railanalysis.com/indian-railways-takes-various-measures-to-prevent-cattle-run-over-incidents/ | News |
| S22 | Rail fracture spotted by LP (Thane, 2020) - https://www.etvbharat.com/english/state/maharashtra/maha-loco-pilot-notices-rail-fracture-in-time-averts-mishap/na20200105191220967 | News |
| S23 | Cyclone Biparjoy wind monitoring - https://swarajyamag.com/amp/story/infrastructure/railways-prepares-action-plan-gears-up-to-handle-cyclonic-storm-biparjoy | News |
| S24 | Kavach explainer - https://www.dtnext.in/news/tamilnadu/dt-next-explains-what-is-kavach | News |
| S25 | Bhore ghat bankers - https://irfca.org/members/sites/apub/tkw/index.htm ; Vande Bharat climbs ghat without bankers - https://www.deccanherald.com/national/in-a-first-two-vande-bharat-trains-climb-sahyadri-ghats-without-additional-locomotives-1190112 | Enthusiast / News |
| S26 | Ara derailment and route learning (2026) - https://dailypioneer.com/news/ara-derailment-crew-route-learning-warning | News |
| S27 | IR Permanent Way Manual Ch. IX (gateman duties) - https://indianrailways.gov.in/railwayboard/uploads/codesmanual/IRPWM/PermanentWayManualCh9_data.htm | Manual |
| S28 | Churchgate dead-end overrun - https://www.business-standard.com/article/pti-stories/railway-minister-orders-probe-into-freak-train-accident-115062900178_1.html | News |
| S29 | Shunting 15 km/h (SER G&SR amendment) - https://ser.indianrailways.gov.in/cris//uploads/files/1756198654310-G&SR_SER%20A&C%201-26.pdf ; IRFCA shunting - https://irfca.org/docs/shunting-rules.html | Zonal / Enthusiast |
| S30 | Brake binding incidents - https://udayavani.com/?p=1428890 ; https://patnapress.com/jansadharan-express-coach-fire-bihiya-smoke-panic/ | News |
| S31 | Medical help at next station - https://www.mypunepulse.com/?p=101782 | News |
| S32 | Rail roko 2021 - https://scroll.in/latest/987274/rail-roko-agitation-trains-stopped-in-some-places-as-farmers-sit-on-tracks-to-protest-farm-laws | News |
| S33 | Mumbai suburban fatalities 2024 - https://www.theweek.in/wire-updates/national/2025/07/23/des58-lsq-rail-mumbai-accidents.html | News (Parliament answer) |
| S34 | Storm brings tree onto OHE (Danapur 2026) - https://patnapress.com/danapur-rail-disruption-storm-ohe-wires-trains-delayed/ | News |
| S35 | Kathua driverless goods train (2024) - https://www.deccanherald.com/amp/story/india%2Fdriverless-train-northern-railways-removes-loco-pilot-from-service-for-negligence-2915945 ; https://www.tribuneindia.com/news/j-k/driverless-train-kathua-station-master-removed-from-service-597560 | News |
| S36 | Crew spot landslide and stop train (Karnataka) - https://www.deccanherald.com/india/karnataka/alert-crew-notice-landslide-stop-train-to-avert-tragedy-1012809.html | News (headline-level; not fully read) |

---

## Quick index

| # | Scenario | Modes | Tier |
|---|---|---|---|
| 1 | Summer heat (rail buckling, cab heat) | all | 2 |
| 2 | Monsoon heavy rain, poor visibility | IC, MP, GD | 1 |
| 3 | Water over rail / flooded track | all | 2 |
| 4 | Winter fog | IC, MP, GD | 2 |
| 5 | Thunderstorm / cyclone wind | IC, MP, GD | 2 |
| 6 | Dust storm | IC, MP, GD | 2 |
| 7 | Cattle on track | MP, GD, IC | 1 |
| 8 | Elephant corridor | MP, GD, IC | 2 |
| 9 | Level-crossing violation | all | 1 |
| 10 | Trespassers | SL, MP | 1 |
| 11 | Landslide / boulder fall | IC, MP, GD | 3 |
| 12 | Rail fracture | all | 2 |
| 13 | OHE failure / tripping / entanglement | all electric | 2 |
| 14 | Signal failure | all | 2-3 |
| 15 | Hot axle | IC, MP, GD | 2 |
| 16 | Brake binding | all | 2 |
| 17 | Alarm chain pulling (ACP) | IC, MP | 1 |
| 18 | Medical emergency on board | IC, MP | 1 |
| 19 | Platform change | IC, MP, SL | 1 |
| 20 | Late-running preceding train | all | 2 |
| 21 | Maintenance / power block | all | 2 |
| 22 | Bridge speed caution | all | 1 |
| 23 | Tunnels | IC, MP, GD | 1 |
| 24 | Ghat gradients and bankers | IC, MP, GD | 3 |
| 25 | Single-line crossing | MP, GD, IC | 2 |
| 26 | Crew change | IC, MP, GD | 1 |
| 27 | Loco swap / traction change | IC, MP | 1 |
| 28 | Shunting | GD, MP | 1 |
| 29 | Loop-line halt | GD, MP | 1 |
| 30 | Technical halt | IC, GD | 1 |
| 31 | Diversion | IC, MP, GD | 3 |
| 32 | Talking to Control / Station Master | all | 1 |
| 33 | Caution order at notice station (NEW) | all | 1 |
| 34 | Wheel flat (NEW) | MP, GD, SL | 2 |
| 35 | Train parting (NEW) | GD, MP | 3 |
| 36 | Stone pelting (NEW) | IC, MP | 1 |
| 37 | Fire in coach (NEW) | IC, MP, SL | 3 |
| 38 | OHE neutral section coasting (NEW) | all electric | 2 |
| 39 | Catch / slip sidings (NEW) | GD, MP | 3 |
| 40 | Stabling and runaway prevention (NEW) | GD | 2 |
| 41 | Dead-end terminal approach (NEW) | SL, IC, MP | 1 |
| 42 | Banker coordination (NEW) | GD, MP | 3 |
| 43 | Agitation / rail roko (NEW) | all | 2 |
| 44 | Loco failure, protection and assistance (NEW) | all | 3 |
| 45 | Held at first stop signal (NEW) | all | 1 |
| 46 | Kavach / ATP intervention (NEW) | IC, SL, MP | 2 |
| 47 | Vigilance Control Device (NEW) | all | 1 |
| 48 | Sign-on fitness / breath analyser (NEW) | all | 1 |
| 49 | Turnout and through-station speeds (NEW) | all | 1 |
| 50 | Pushing back / propelling (NEW) | GD, SL | 2 |
| 51 | Total communication failure, paper authority (NEW) | MP, GD | 3 |
| 52 | Gate stop signal (NEW) | all | 2 |
| 53 | Headlight dimming (NEW) | all | 1 |
| 54 | Hours-of-duty limit (NEW) | GD, MP | 2 |

---

## Scenario cards

### 1. Summer heat haze, rail buckling and cab heat
- **Modes / Tier:** all / 2
- **Trigger:** Midday in April-June on long welded rail. Heat shimmer on the track ahead. Optional event: a visible lateral "kink" or a jerk felt underfoot. A temporary speed restriction may appear on the caution order.
- **Correct response:** Track staff run hot-weather patrolling and watch rail temperature, and a 50 km/h restriction can be imposed if rail temperature after maintenance work goes above a set limit during consolidation [S14]. For the LP: obey every temporary restriction on the caution order (GR 4.08, 4.09) [S1]. If a kink or unusual lurch is seen or felt, stop or slow down as needed and report the location to the next Station Master or Control. The reporting step is general LP practice seen in news reports [S22]; a specific heat-kink reporting rule was not found (**UNVERIFIED**).
- **Penalty (design):** Running through a reported kink above the restricted speed causes a derailment risk roll. Not reporting the kink sets a "following train derails" consequence and a large score loss.
- **Why this rule exists:** Steel rails expand in heat, and a welded track can suddenly buckle sideways if the stress is not released.

### 2. Monsoon heavy rain and poor visibility
- **Modes / Tier:** IC, MP, GD / 1
- **Trigger:** Heavy rain cuts sighting distance. Wipers on max. Monsoon timetable active on ghat or coastal routes.
- **Correct response:** On Konkan Railway, the 2026 monsoon notice tells LPs to cut speed to 40 km/h when visibility is poor in heavy rain, and a monsoon timetable runs from 15 June to 20 October with sectional restrictions [S13]. GR 4.55 asks the LP to choose shut-off and braking points with weather and rail condition in mind [S1].
- **Penalty (design):** Above 40 km/h in "low visibility" zones gives a safety-score deduction. Overshooting a signal on wet rail ends the run as a SPAD.
- **Why this rule exists:** Wet rails lengthen braking distance just as rain shortens how far ahead the driver can see.

### 3. Water over rail / flooded track
- **Modes / Tier:** all / 2
- **Trigger:** Water level visible near or over rail top. Caution order says "water over rail" with a km range. Suburban variant: waterlogging in a cutting.
- **Correct response:** Konkan's 2026 instruction is to stop the train if water goes more than 100 mm above rail level [S13]. IRFCA reports that on Western Railway flood-prone stretches, diesels ran at 5 km/h with water under 3 inches above rail, and electrics at 15 km/h; electrics at 8 km/h up to 4 inches [S5] (enthusiast source; numbers vary by zone, treat as **UNVERIFIED** for other zones). Follow the caution order speed [S1].
- **Penalty (design):** Entering water above the limit causes traction-motor failure (electric) or a stall (diesel) and a forced rescue. Speeding through water causes a ballast-washout derailment risk.
- **Why this rule exists:** Water can hide washed-out ballast and damage electric traction motors, so the train must either crawl or not go at all.

### 4. Winter fog
- **Modes / Tier:** IC, MP, GD / 2
- **Trigger:** Visibility drops in Dec-Feb on north Indian plains. Fog Safety Device (FSD) gives voice alerts for upcoming signals and level crossings. Detonators explode under the wheels near stop signals.
- **Correct response:** The LP sets speed according to visibility, capped at 75 km/h on locos with fog devices (raised from 60 km/h in 2022) [S7]. Whistle frequently near level crossings [S7]. Fog signalmen place detonators about 270 m behind the first stop signal when visibility fails a test; FSDs give distance to signals but not their aspect [S5]. In automatic block territory, a Northern Railway practice capped speed at 60 km/h after green and 30 km/h after double yellow in fog [S5] (enthusiast source).
- **Penalty (design):** Above 75 km/h in fog flags an overspeed. Ignoring a detonator (no slowdown within N seconds) counts as a near-SPAD. Passing a red signal ends the run.
- **Why this rule exists:** In thick fog the driver may see a signal only seconds before reaching it, so speed must allow a stop within sighting distance.

### 5. Thunderstorm, squall and cyclone wind
- **Modes / Tier:** IC, MP, GD / 2
- **Trigger:** Storm warning from Control. Gusts shake the train. Optional: tree on OHE, OHE trips.
- **Correct response:** During Cyclone Biparjoy (2023), Western Railway read anemometers hourly and Station Masters regulated or stopped trains; one report describes a scheme of 40 km/h above 70 km/h wind and suspension above 90 km/h [S23] (zone and policy not confirmed, **UNVERIFIED**). A 2026 storm brought a tree down on the OHE near Bihta and cut power [S34]. LP should follow Control or SM instructions and caution orders, and report any OHE damage to the TPC through the SM or Control [S17].
- **Penalty (design):** Ignoring a wind-stop order on an exposed bridge triggers a high-risk event. Running into a fallen-tree obstruction at speed causes OHE damage and a long delay.
- **Why this rule exists:** Strong crosswinds can push light coaches off exposed bridges and embankments, and falling trees can bring down live wires.

### 6. Dust storm
- **Modes / Tier:** IC, MP, GD / 2
- **Trigger:** Brown-out visibility in Rajasthan / UP pre-monsoon. Possible snapped OHE.
- **Correct response:** GR 9.02(3) names dust storms among conditions where, if passing an automatic signal at 'on', the LP must not exceed 8 km/h when the line ahead cannot be seen clearly [S2]. A 2018 dust storm in Rajasthan and UP delayed trains when overhead cables broke [S34-related coverage; see Uncertain list]. Otherwise use fog-like reduced speed under the LP's judgment and any caution order [S1].
- **Penalty (design):** Same as fog. Add OHE-break event if the player runs at line speed through a storm warning.
- **Why this rule exists:** Dust can blank out signals as completely as fog, and strong winds bring down wires and branches.

### 7. Cattle on track
- **Modes / Tier:** MP, GD, IC / 1
- **Trigger:** Animals on or near the track, often near villages and unfenced stretches.
- **Correct response:** IR has asked crews to whistle frequently at cattle run-over-prone locations and is fencing such stretches [S21]. Reports show LPs stop after hitting cattle, then check the loco [S21-linked report]. A specific stop-and-report rule for cattle was not found (**UNVERIFIED**); use the general rule that an LP must stop and report anything that may affect safe running (GR 4.40 lookout) [S1].
- **Penalty (design):** No whistle at a marked hotspot gives a small penalty. Hitting an animal causes a delay of several minutes plus a "loco inspection" mini-task; failing the inspection gives a damage risk (e.g., cattle guard bent).
- **Why this rule exists:** IR records tens of thousands of cattle hits a year, and each one can damage the loco and delay many trains [S21].

### 8. Elephant corridor
- **Modes / Tier:** MP, GD, IC / 2
- **Trigger:** Signboard for an elephant corridor, night-time, herd sighted. NFR / Kerala / Tamil Nadu routes.
- **Correct response:** Trains run at restricted speed in identified elephant corridors, with signage and crew training [S9]. Reported rules at some corridors ask for 45 km/h at night [S9]. A thermal camera system that warns LPs of animals at night is described in a Parliament answer [S9]. In a reported NFR case, Rajdhani crew braked and stopped short of a herd at night [S9].
- **Penalty (design):** Overspeed inside a marked corridor gives a large penalty. Hitting an elephant ends the run (derailment risk plus wildlife fatality).
- **Why this rule exists:** An elephant hit can kill the animal and derail the train, and herds often cross at the same places, so lower speed gives time to stop.

### 9. Level-crossing violation
- **Modes / Tier:** all / 1
- **Trigger:** Vehicle stuck on an LC, or gate left open. Gateman shows red hand signal.
- **Correct response:** When an LC is open to road traffic, the gateman must be ready to show a stop hand signal to the train (GR 16.03(2)); if there is an obstruction he keeps the gate signals at danger and protects it (GR 16.07) [S4]. The IRPWM also has the gateman show red throughout the time the LC is open [S27]. The LP must obey any stop hand signal immediately (GR 4.42(2)) [S1] and whistle at the whistle boards before LCs (see Uncertain list on W/L board wording).
- **Penalty (design):** Missing the whistle board gives a small penalty. Ignoring the gateman's red flag counts as a SPAD-equivalent.
- **Why this rule exists:** At an open or blocked gate the gateman's red flag is the only protection between the train and road traffic.

### 10. Trespassers
- **Modes / Tier:** SL, MP / 1
- **Trigger:** People crossing tracks between platforms, walking along the line, or sitting on tracks. Heavy in Mumbai suburban.
- **Correct response:** Keep a continuous lookout (GR 4.40) and whistle [S1]. Brake if a person is in danger. After an injury or run-over, stop and report to the next station (general accident reporting, GR 6.01) [S3]. Mumbai's suburban network recorded 2,282 fatalities in 2024 from trespassing, falls and other causes [S33]. A motorman-specific procedure was not found (**UNVERIFIED**).
- **Penalty (design):** Not whistling on sighting gives a penalty. A hit with no stop/report gives a large penalty and an RPF inquiry delay.
- **Why this rule exists:** A train cannot swerve and needs hundreds of metres to stop, so warning early is the main way to save a trespasser.

### 11. Landslide / boulder fall
- **Modes / Tier:** IC, MP, GD / 3
- **Trigger:** Monsoon on ghat/coastal routes. Debris visible around a curve. Caution order lists vulnerable cuttings.
- **Correct response:** Konkan Railway posts round-the-clock patrol and watchmen at vulnerable cuttings in monsoon and runs a lower-speed monsoon timetable [S13]. A reported Karnataka case had alert crew spot a landslide and stop the train [S36]. If the train is stopped by an obstruction, the LP signals the guard, and both protect the train and adjacent lines per GR 6.03 [S3].
- **Penalty (design):** Entering a "vulnerable cutting" above monsoon speed gives a penalty. Hitting debris causes a derailment. Not protecting the train after stopping gives an "adjacent line collision" risk.
- **Why this rule exists:** Saturated hillsides can drop rock onto the track without warning, so speed must allow a stop within sight.

### 12. Rail fracture
- **Modes / Tier:** all / 2
- **Trigger:** LP sees a gap in the rail, or feels a sharp jerk.
- **Correct response:** In the reported Thane case (2020), the LP braked after seeing a fracture; after repair the next train passed at a restricted 10 km/h [S22]. In a Madhya Pradesh case, crew informed Control and engineering staff clamped the fracture [S22-linked coverage]. General rule: report to Control/SM and follow the caution order issued afterward [S1].
- **Penalty (design):** Felt a jerk and did not report: the next AI train derails and the player loses a large score. Running over a reported fracture above the caution speed: derailment risk.
- **Why this rule exists:** One broken rail can derail the next train, so every jerk or gap must be reported at once.

### 13. OHE failure, tripping, pantograph entanglement
- **Modes / Tier:** all electric / 2
- **Trigger:** Catenary voltage drops to zero, loco trips, sparking from pantograph, sagging wire visible.
- **Correct response:** Any railway employee must report OHE abnormalities or pantograph trouble to the Traction Power Controller (TPC), directly or through an SM or section controller; the TPC switches off supply and arranges an emergency power block [S17]. A loco handbook cited in search results advises checking the pantograph physically rather than trusting the voltmeter (**UNVERIFIED**, not directly read). The exact order (lower pantograph vs. call TPC first) was not found (**UNVERIFIED**).
- **Penalty (design):** Raising the pantograph under a reported damaged wire causes entanglement and a long block. Not reporting gives a delay penalty to following trains.
- **Why this rule exists:** The overhead wire carries 25 kV, and a broken wire or snagged pantograph can halt every electric train in the section.

### 14. Signal failure (automatic and absolute block)
- **Modes / Tier:** all / 2 (absolute), 3 (automatic)
- **Trigger:** Automatic stop signal stays red or is blank. Or SM gives a written authority to pass a defective signal.
- **Correct response:** At an automatic stop signal at 'on': stop, wait 1 minute by day or 2 by night, then sound the whistle code, exchange signals with the guard, and proceed with great caution as far as the line is clear, ready to stop short of any obstruction (GR 9.02); if the line ahead cannot be seen clearly, do not exceed 8 km/h [S2]. On single line, use a signal-post telephone if present and get SM/CTC permission first (GR 9.07) [S2]. Report signals passed at 'on' at the next reporting station (GR 9.11) [S2]. Speed limits under written authority have differed in practice (10 km/h vs 15 km/h); the CRS Kanchanjunga probe found only one of the trains followed the 15 km/h plus 1-minute-stop norm [S10].
- **Penalty (design):** Leaving before the wait time ends counts as a SPAD. Speeding after passing a failed signal counts as a major violation (the Kanchanjunga crash, 2024, is the teaching example).
- **Why this rule exists:** A failed signal cannot tell you whether the train ahead has stopped, so you must move slowly enough to stop within what you can see.

### 15. Hot axle
- **Modes / Tier:** IC, MP, GD / 2
- **Trigger:** Trackside hot-axle detector alarm relayed by Control, or smoke/smell from a bogie.
- **Correct response:** An SCR circular sets bands: at 140-200 C the coach can stay on the train with carriage-and-wagon (C&W) staff escorting it; above 200 C the coach is detached [S11]. In electrified sections, the TPC is told to switch off OHE and the LP is advised over the emergency phone [S11]. Zonal circular; other zones may differ (**UNVERIFIED** nationally).
- **Penalty (design):** Ignoring a hot-axle alert leads to an axle-burn-off derailment roll after X km. Correct stop and detach costs time but no penalty.
- **Why this rule exists:** A failing bearing heats up until the axle can shear off and derail the coach.

### 16. Brake binding
- **Modes / Tier:** all / 2
- **Trigger:** Smoke and burning smell from a wheel, sluggish acceleration, guard reports sparks.
- **Correct response:** In reported cases the LP stopped the train on seeing smoke and told Control; technical staff checked the coach before it was allowed on [S30]. A formal step list for the LP was not found (**UNVERIFIED**).
- **Penalty (design):** Continuing with binding brakes causes a wheel-flat (see #34) and possible fire (#37).
- **Why this rule exists:** A brake that will not release turns the wheel into a heater and can start a fire.

### 17. Alarm chain pulling (ACP)
- **Modes / Tier:** IC, MP / 1
- **Trigger:** Brake pipe pressure drops, ACP lamp and buzzer in cab, power cut.
- **Correct response:** ACP vents the brake pipe; the cab shows a lamp and buzzer and power drops [S5]. A flap near the coach's emergency valve shows which coach; it must be reset by hand, often by the assistant LP or guard [S5][S12]. Ignoring a genuine ACP is a serious offence [S5]. Pulling without good reason is punishable under Section 141 of the Railways Act, 1989 (reported as fine up to Rs 1,000 and/or up to 1 year) [S12].
- **Penalty (design):** Restarting without the reset/check task gives a penalty. Disabling the alarm gives a severe penalty (the IRFCA FAQ calls this a hazard).
- **Why this rule exists:** The chain may be the only way a passenger can report a fire, a fall, or someone left behind.

### 18. Medical emergency on board
- **Modes / Tier:** IC, MP / 1
- **Trigger:** Control radios that a passenger is ill; doctor will meet the train at the next station.
- **Correct response:** The TTE, train manager or Rail Madad 139 passes word to the next station, where a medical team waits [S31]. The LP's role is to run to the stop as instructed by Control and stop accurately at the platform. Unscheduled stops on Control's orders are possible but no formal rule was found (**UNVERIFIED**).
- **Penalty (design):** Missing the instructed stop or stopping badly off the platform gives a penalty. Bonus for on-time arrival.
- **Why this rule exists:** Railways bring help to the next station because a moving train is far from any hospital.

### 19. Platform change
- **Modes / Tier:** IC, MP, SL / 1
- **Trigger:** Control/SM changes the reception platform; the route set differs from the timetable.
- **Correct response:** Act on the signals as displayed, not on expectation (GR 4.35 for starting; signal indications in general) [S1]. The SCR crew precautions note stresses confirming that a signal is meant for your train before starting [S15]. Turnout speed limits apply (see #49).
- **Penalty (design):** Taking a turnout above its limit gives a derailment roll. Stopping at the wrong platform position gives a minor penalty.
- **Why this rule exists:** The route ahead is set by the signal box, and the driver must read what is set, not assume.

### 20. Late running of the preceding train
- **Modes / Tier:** all / 2
- **Trigger:** Yellow and double-yellow aspects one after another on automatic block; a train is ahead.
- **Correct response:** Obey each aspect; do not try to recover more time between stations than the WTT allows (GR 4.08) [S1]. On automatic signals, see #14 for red. The SCR circular notes that SPADs often happen after long stops and restarts, and asks crews to keep alert and informed [S15].
- **Penalty (design):** Running on yellow at full speed gives a penalty. SPAD ends the run.
- **Why this rule exists:** Automatic signals space trains only by the track ahead, so chasing the leader at speed removes your safety margin.

### 21. Maintenance block / power block
- **Modes / Tier:** all / 2
- **Trigger:** Caution order mentions a traffic or power block; engineering crew ahead; stop indicator or banner flag.
- **Correct response:** Blocks are requested by engineering and granted by the division; the last train before the block gets a caution order to look out for the engineering crew's stop signal [S5]. Power blocks switch off OHE [S5]. Obey indicators, hand signals and banner flags, and any "stop dead" instruction [S5].
- **Penalty (design):** Passing a banner flag counts as a SPAD. Overspeed through a worksite gives a large penalty (worker safety).
- **Why this rule exists:** Workers on the track rely entirely on trains obeying the caution order and the stop flag.

### 22. Bridge speed caution
- **Modes / Tier:** all / 1
- **Trigger:** Permanent restriction (in WTT) or temporary (on caution order) at a bridge; flood alert.
- **Correct response:** Obey the limit (GR 4.08, 4.09) [S1]. In floods, the Godavari bridge was cut from 60 to 20 km/h by caution order [S19]; the Yamuna bridge at Delhi ran at 20 km/h and closed when the river crossed the stop level [S19]. In 2024 the Railway Board set up a committee after crews ran at 120 km/h through a 20 km/h bridge restriction [S19-linked report, see Uncertain list].
- **Penalty (design):** Overspeed on a bridge counts as a major violation (suspension in-game).
- **Why this rule exists:** Bridges under repair or under flood load can fail under the extra force of a fast train.

### 23. Tunnels
- **Modes / Tier:** IC, MP, GD / 1
- **Trigger:** Tunnel portal ahead.
- **Correct response:** Sound the whistle code when entering tunnels (GR 4.50) [S1]. Do not throw water, fire or cinders in tunnels (GR 4.52) [S1]. Headlights must work (GR 4.32(c)) [S1].
- **Penalty (design):** Missing the whistle gives a small penalty.
- **Why this rule exists:** Track workers inside a tunnel have nowhere to see the train coming, so the whistle is their warning.

### 24. Ghat gradients and bankers
- **Modes / Tier:** IC, MP, GD / 3
- **Trigger:** Steep section (e.g., Bhore ghat ~1 in 37 between Karjat and Lonavala) [S25].
- **Correct response:** Bankers are attached at the rear to guard against parting and roll-back on steep climbs; passenger trains generally need them on very steep grades [S5][S25]. Some ghats have mandatory brake halts, delayed signals and automatic points that divert a train that did not halt long enough into a catch siding; some have auto emergency brakes above about 25 km/h [S5]. Vande Bharat sets have climbed the Mumbai ghats without bankers [S25]. A mandatory brake test at Karjat is reported by forums only (**UNVERIFIED**).
- **Penalty (design):** Departing a brake halt early sends the train into the catch siding. Overspeed on a descent triggers auto brake and a long delay.
- **Why this rule exists:** On a steep down grade a train that loses brakes cannot stop, so checks and catch sidings exist before the worst slopes.

### 25. Single-line crossing
- **Modes / Tier:** MP, GD, IC / 2
- **Trigger:** Train scheduled to cross an opposing train at a station on single line; one train goes to the loop.
- **Correct response:** On single line the LP must hold the authority to enter the section (token, staff, or written authority) [S5]. Loop entry over turnouts follows the turnout speed (GR 4.10) [S1]. Stop clear of fouling marks (GR 4.56, 4.58) [S1]. Detailed token-exchange speeds were not found for IR (**UNVERIFIED**).
- **Penalty (design):** Entering a section without authority ends the run (head-on risk). Fouling the main line from the loop blocks the crossing train.
- **Why this rule exists:** On single line, only one train may own the section, and the token proves you are that train.

### 26. Crew change
- **Modes / Tier:** IC, MP, GD / 1
- **Trigger:** Scheduled crew-change station.
- **Correct response:** Crew sign on at the crew lobby, with breath-analyser testing before duty [S15]. Since 2025, crews declare in the Crew Management System whether they carry a personal mobile phone [S15-related report]. Handover content (e.g., passing on loco defects, caution orders) is not documented in sources found (**UNVERIFIED**).
- **Penalty (design):** Skipping the handover checklist hides a defect that appears later.
- **Why this rule exists:** The new crew can only drive safely if they know what the old crew knew about the train.

### 27. Loco swap / traction change
- **Modes / Tier:** IC, MP / 1
- **Trigger:** Electric-to-diesel change at a junction, or loco reversal at a terminal.
- **Correct response:** Coupling is a shunting move at no more than 15 km/h, under authorised supervision, with the rake on air brakes [S29]. Precautions for attaching locos are listed in GR 5.13-5.15 [S29]. Brake continuity check before departure: the guard confirms brake power (GR 4.34(b)) and the SM does not authorise departure until fitness and brake power are certified (GR 4.31) [S1].
- **Penalty (design):** Coupling above 15 km/h causes passenger injuries/damage. Departing without brake check gives a major penalty.
- **Why this rule exists:** A new loco is useless unless its brakes reach every coach, so the brake check is part of the swap.

### 28. Shunting
- **Modes / Tier:** GD, MP / 1
- **Trigger:** Yard work, attaching or detaching wagons.
- **Correct response:** Max 15 km/h, supervised by an authorised person; hand, loose and fly shunting are prohibited [S29].
- **Penalty (design):** Over 15 km/h gives a penalty; hard coupling gives wagon damage.
- **Why this rule exists:** Yards are full of staff on foot and slow, controlled moves prevent crushing accidents.

### 29. Loop-line halt
- **Modes / Tier:** GD, MP / 1
- **Trigger:** Goods train put into a loop to let a faster train pass.
- **Correct response:** Enter at turnout speed (GR 4.10) [S1]; stop clear of fouling marks or tell the station if you can't (GR 4.56, 4.58) [S1]. If held long, stay alert: SPADs often follow long halts [S15].
- **Penalty (design):** Fouling the main line gives a large penalty. Starting against a red on restart is a SPAD.
- **Why this rule exists:** A train sticking out of the loop puts its tail in the path of the express it is waiting for.

### 30. Technical halt
- **Modes / Tier:** IC, GD / 1
- **Trigger:** Non-commercial stop for crew change, water, or examination.
- **Correct response:** No passenger train may be moved after stopping at a station except on the guard's orders or to avoid an accident (GR 4.59) [S1]. Do not start without authority, signals and the guard's start signal (GR 4.35(1)) [S1].
- **Penalty (design):** Starting before the guard's signal gives a penalty ("passenger left on track" event).
- **Why this rule exists:** At any stop someone may be getting on, off, or under the train, so it moves only on clear authority.

### 31. Diversion
- **Modes / Tier:** IC, MP, GD / 3
- **Trigger:** Main route blocked; train diverted over an unfamiliar line.
- **Correct response:** An LP must have route knowledge; one rule reported after the 2026 Ara derailment is two route-learning trips if the LP has not worked a route for six months to two years [S26]. The LP and supervisors were suspended for incomplete route learning [S26]. Use of a pilot/conductor LP on diversions is common practice but no rule text was found (**UNVERIFIED**).
- **Penalty (design):** Driving a diverted route without a "route conductor" makes signals appear later (reduced preview), and overspeed risk rises.
- **Why this rule exists:** Drivers brake for curves, slopes and signals they know are coming; on a strange route they can't.

### 32. Communication with Control / Station Master
- **Modes / Tier:** all / 1
- **Trigger:** Any abnormal event.
- **Correct response:** The driver obeys guard and SM orders on the journey (GR 4.37, 4.39) [S1]. When an engine can't proceed, the guard (or driver if no guard) reports location, nature and cause to the nearest station (GR 6.05-related) [S3]. Gatemen and others exchange "private numbers" to log critical messages [S5][S27]. The SCR circular asks SMs and Control to keep waiting crews informed [S15].
- **Penalty (design):** Unreported events multiply later penalties; confirmed messages (with "private number" mechanic) give a bonus.
- **Why this rule exists:** The LP sees only one train; Control and SMs see the whole section, so information must flow both ways.

### 33. Caution order handed at a notice station (NEW)
- **Modes / Tier:** all / 1
- **Trigger:** At a notice station the SM hands a slip listing km ranges, reasons and speeds; may be "nil" or a "reminder".
- **Correct response:** A caution order lists the stations, km, reason and maximum speed; it's handed at the station before the restriction (GR 4.09) [S1][S6]. Fresh orders are issued at each notice station; a "nil" order means nothing until the next notice station [S5]. Permanent restrictions are in the WTT, not on caution orders [S5].
- **Penalty (design):** Mini-game: read the caution order. Each missed restriction later is an overspeed violation.
- **Why this rule exists:** Temporary track faults change daily, and the caution order is the only way the driver learns of them.

### 34. Wheel flat (NEW)
- **Modes / Tier:** MP, GD, SL / 2
- **Trigger:** Rhythmic thumping after a hard brake or binding brake.
- **Correct response:** No IR LP procedure was found in sources (**UNVERIFIED**). Reasonable game handling: report to Control for examination at the next C&W point. Do not present this as an IR rule.
- **Penalty (design):** Ignoring it raises track-damage and rail-fracture risk in later runs.
- **Why this rule exists:** A flat spot hammers the rail on every turn of the wheel and can crack rails and axles. (General engineering fact; IR-specific limits **UNVERIFIED**.)

### 35. Train parting (NEW)
- **Modes / Tier:** GD, MP / 3
- **Trigger:** Sudden brake-pipe pressure drop, loco feels light, guard shows a green flag waved up and down.
- **Correct response:** The LP keeps the front portion moving if possible until the rear stops, then sounds the whistle code (GR 6.08) [S3]; IRFCA notes the LP avoids braking hard so the rear doesn't hit the front [S5]. The guard secures and protects the rear (GR 6.08, 6.03) [S3]. Recoupling is allowed under guard's hand signals if in sight; otherwise the guard gives written authority to proceed with the front portion (GR 6.09) [S3]. On single-line token working the token goes to the guard against a receipt [S3].
- **Penalty (design):** Emergency braking on parting causes a rear-into-front collision. Leaving without written authority ends the run.
- **Why this rule exists:** A broken coupling turns one train into two, and the front half must not stop in front of the rolling back half.

### 36. Stone pelting (NEW)
- **Modes / Tier:** IC, MP / 1
- **Trigger:** Windscreen crack, side-window impact, loud bang.
- **Correct response:** In reported cases crew report the incident to the railway administration and RPF investigates [S16]. Legal sections cited in reports vary (152, 153 of the Railways Act) [S16]. An LP rule on whether to stop or continue was not found (**UNVERIFIED**); a reasonable game rule is to report and continue unless vision or crew safety is affected.
- **Penalty (design):** Not reporting gives a small penalty; continuing at full speed with a shattered screen gives a visibility penalty.
- **Why this rule exists:** A stone through the windscreen can blind or injure the driver, so every case is reported for police action.

### 37. Fire in coach (NEW)
- **Modes / Tier:** IC, MP, SL / 3
- **Trigger:** Guard or passenger reports smoke; ACP; flames visible in mirror.
- **Correct response:** In reported cases the LP stopped immediately so passengers could leave, and burning coaches were detached [S18]. GR 6.10 says a fire likely to cause loss of life or property must be fought by the nearest railway servant and reported to the nearest SM; electrical fires need supply isolated by trained staff [S3]. An SCR bulletin noted there was no SOP for isolating coaches in a fire under traction power [S18]. A rule against stopping on bridges or in tunnels was not found (**UNVERIFIED**).
- **Penalty (design):** Slow reaction lets fire spread to adjacent coaches. Detaching without OHE isolation causes an electrical hazard.
- **Why this rule exists:** Fire spreads through a coach in minutes, so stopping fast and separating the burning coach saves lives.

### 38. OHE neutral section coasting (NEW)
- **Modes / Tier:** all electric / 2
- **Trigger:** Warning board about 500 m before a neutral section (phase break).
- **Correct response:** Open the DJ / circuit breaker at the warning board and coast through the dead section, closing it after the section [S8]. Fog makes the boards hard to see [S8]. Some sections use Automatic Switched Neutral Section (ASNS) [S8]. Rule for a train stalled in a neutral section was not found (**UNVERIFIED**).
- **Penalty (design):** Entering with breaker closed causes a flashover and OHE trip. Entering too slow on a rising grade causes a stall needing rescue.
- **Why this rule exists:** The gap separates two different power phases, and bridging it under load causes a dangerous arc.

### 39. Catch sidings and slip sidings (NEW)
- **Modes / Tier:** GD, MP / 3
- **Trigger:** Station at the foot of a steep down grade with a catch siding.
- **Correct response:** Stop before the catch siding and wait for points to be set by signal, horn, key, or timed automatic points (about 90 s on some ghats) [S5]. Runaway vehicles are turned into catch sidings or sand traps [S5].
- **Penalty (design):** Running before points are set sends the train into the sand drag.
- **Why this rule exists:** The catch siding is a last chance to stop a runaway before it reaches the station.

### 40. Stabling and runaway prevention (NEW)
- **Modes / Tier:** GD / 2
- **Trigger:** LP must leave a goods train stabled at a station on a gradient.
- **Correct response:** In the Kathua case (2024), a goods train rolled about 70-84 km without crew; the LP was removed from service for failing to apply all loco and wagon brakes and not making a stabling register entry; the SM was faulted for not re-checking and chaining wheels [S35]. GR 4.61 forbids a driver leaving a working loco except in absolute necessity with a qualified person in charge [S1]. Stabling on running lines only when unavoidable, with points secured (GR 4.62-4.64) [S1].
- **Penalty (design):** Mini-task: hand brakes + wedges + register. Missing any step gives a runaway event.
- **Why this rule exists:** On a slope, air brakes leak off over time, so a parked train must be held mechanically.

### 41. Dead-end terminal approach (NEW)
- **Modes / Tier:** SL, IC, MP / 1
- **Trigger:** Approaching a terminus with buffer stops (e.g., Churchgate, CSMT, Howrah).
- **Correct response:** A Churchgate suburban train hit the dead end at about 36 km/h in 2015, injuring passengers; hydraulic buffers reduced the impact [S28]. An IR approach-speed limit for terminals was not found in sources (**UNVERIFIED**); the game should use a section-configurable limit and GR 4.49/4.55 smooth, planned braking [S1].
- **Penalty (design):** Overshoot hits the buffer; speed at impact sets damage and injury score.
- **Why this rule exists:** At a dead end there is no overlap, so any braking misjudgment ends at the buffer stop.

### 42. Banker coordination (NEW)
- **Modes / Tier:** GD, MP / 3
- **Trigger:** Banker attached at rear; start on gradient.
- **Correct response:** Lead and banker crews coordinate by horn codes, walkie-talkies and watching traction current [S5]. On parting, the banker driver stops the rear portion and whistles (GR 6.08) [S3].
- **Penalty (design):** Starting before the banker's acknowledgement gives a jerk that can break a coupler.
- **Why this rule exists:** Two locos at opposite ends must push and pull together, or the couplers between them take the strain.

### 43. Line blocked by agitation / rail roko (NEW)
- **Modes / Tier:** all / 2
- **Trigger:** Control warns of protesters on track; trains held at stations.
- **Correct response:** In 2021 rail rokos, trains were held at stations as a precaution and police cleared protesters [S32]. LP follows Control/SM instructions and does not enter the blocked section. No specific LP rule found (**UNVERIFIED**).
- **Penalty (design):** Proceeding against Control's hold gives a major penalty.
- **Why this rule exists:** People on the track can't be cleared by a train, only by police, so the train waits at a safe place.

### 44. Loco failure, train protection and assistance (NEW)
- **Modes / Tier:** all / 3
- **Trigger:** Loco fails between stations.
- **Correct response:** LP signals the guard with the whistle code; both exchange stop hand signals; the guard (or driver) reports location and cause to the nearest station; if help is asked for, the train must stay put until it arrives [S3]. Protection on BG: one detonator at 600 m, then three about 10 m apart at 1,200 m (GR 6.03) [S3]. In automatic sections: one at 90 m and two 10 m apart at not less than 180 m (GR 9.10) [S3][S2]. Relief engines may be sent into the obstructed block section (SR-level; **UNVERIFIED** exact text).
- **Penalty (design):** Moving after requesting assistance gives a collision risk with the relief engine. Not protecting gives an adjacent-line collision event.
- **Why this rule exists:** A stopped train in mid-section is invisible to the next train until the detonators warn it.

### 45. Held at the first stop signal (NEW)
- **Modes / Tier:** all / 1
- **Trigger:** Stopped at the station's first stop signal with no reason given.
- **Correct response:** After 5 minutes without apparent cause, sound the warning whistle and send a crew member to the station; guard protection follows after 15 minutes (GR 4.44) [S1].
- **Penalty (design):** Passing the signal without authority is a SPAD.
- **Why this rule exists:** A long unexplained stop may mean the station has forgotten the train, which could leave it unprotected.

### 46. Kavach / ATP intervention (NEW)
- **Modes / Tier:** IC, SL, MP / 2
- **Trigger:** On Kavach-fitted routes, the in-cab display shows movement authority and speed limit.
- **Correct response:** Kavach (RDSO-developed) applies brakes automatically if the LP fails to brake for a red signal or overspeed; it uses RFID tags and radio [S24]. It does not detect every obstruction and is not a substitute for maintenance [S24]. Kavach was recommended on priority after Kanchanjunga [S10].
- **Penalty (design):** Every Kavach-forced brake application logs as an LP error (lower than a SPAD, but recorded).
- **Why this rule exists:** Automatic protection catches the human slips that cause most signal and speed accidents.

### 47. Vigilance Control Device (NEW)
- **Modes / Tier:** all / 1
- **Trigger:** VCD prompt (light/buzzer) if no control input for a period.
- **Correct response:** Crew must not bypass the VCD and must tell the traction loco controller if it malfunctions [S15]. Safety devices like VCD and AWS must not be isolated by crew when working (**UNVERIFIED** source; Scribd document).
- **Penalty (design):** Missing the acknowledgement causes an automatic penalty brake application.
- **Why this rule exists:** If the driver becomes unconscious or falls asleep, the VCD stops the train.

### 48. Sign-on fitness and breath analyser (NEW)
- **Modes / Tier:** all / 1
- **Trigger:** Start of shift.
- **Correct response:** Breath-analyser tests are mandatory at sign-on (and reported at sign-off); a crew member found drunk is not allowed on duty [S15]. A rule against alcohol within 8 hours before duty is cited as GR 2.09 in training material (**UNVERIFIED**, secondary source).
- **Penalty (design):** Framed as a tutorial step; the game can show "unfit for duty, run cancelled" if a fatigue/fitness meter is red.
- **Why this rule exists:** A single impaired driver puts hundreds of passengers at risk.

### 49. Turnout and through-station speeds (NEW)
- **Modes / Tier:** all / 1
- **Trigger:** Taking a diverging route; running through an interlocked station.
- **Correct response:** Non-interlocked facing points and turnouts/crossovers: 15 km/h unless special instructions allow more (GR 4.10); through interlocked stations: 50 km/h or lower unless the line is isolated (GR 4.11) [S1]. Many sections have higher sanctioned limits by special instructions (**UNVERIFIED** per route).
- **Penalty (design):** Overspeed on turnouts gives a derailment risk roll.
- **Why this rule exists:** A turnout curve is sharp and short, and too much speed can lift wheels off the rail.

### 50. Pushing back / propelling (NEW)
- **Modes / Tier:** GD, SL / 2
- **Trigger:** Train must reverse outside station limits (e.g., to clear an obstruction).
- **Correct response:** Pushing outside station limits needs special instructions and is capped at 25 km/h, with lights/tail indication at night or poor visibility (GR 4.12) [S1]. Returning on the same line after parting needs the guard's written instructions, plus SM authority on multiple lines [S3].
- **Penalty (design):** Pushing without authority or above 25 km/h gives a major penalty.
- **Why this rule exists:** When pushing, the driver can't see the leading end, so speed and lookouts must make up for it.

### 51. Total communication failure and paper authority (NEW)
- **Modes / Tier:** MP, GD / 3
- **Trigger:** Block instruments and phones dead.
- **Correct response:** With signal/instrument failure but working communication, SMs issue paper line clear tickets carrying a private number; with total breakdown, paper authority may be issued with speed limited to 15 km/h and free use of the horn [S5]. Enthusiast summary (**UNVERIFIED** exact limits per GR Ch. XIV-style rules).
- **Penalty (design):** Entering without written authority ends the run.
- **Why this rule exists:** When the system can't prove the line is clear, written authority and walking pace stand in for it.

### 52. Gate stop signal (NEW)
- **Modes / Tier:** all / 2
- **Trigger:** Gate stop signal at 'on' in an automatic section; 'A' marker lit or dark.
- **Correct response:** With 'A' marker lit, treat as an automatic signal (GR 9.02/9.07). With 'A' marker dark: whistle, stop, wait 1 minute by day / 2 by night, creep up to stop before the LC, and proceed only after confirming gates are closed and receiving the gateman's hand signal (GR 9.15) [S2].
- **Penalty (design):** Crossing the LC before confirming gates closed gives a road-vehicle collision event.
- **Why this rule exists:** The gate signal protects road users, so the train must not enter until the gates are actually shut.

### 53. Headlight dimming (NEW)
- **Modes / Tier:** all / 1
- **Trigger:** At stations at night and when an opposing train approaches on double/multiple track.
- **Correct response:** Dim the headlight at stations and when passing opposing trains on double or multiple lines (GR 4.14(3)) [S1].
- **Penalty (design):** Small penalty; opposing driver "dazzle" event.
- **Why this rule exists:** A full headlight can blind the other driver at the moment he needs to read signals.

### 54. Hours-of-duty limit (NEW)
- **Modes / Tier:** GD, MP / 2
- **Trigger:** Long goods run approaching the duty limit; Control offers relief.
- **Correct response:** Reports say running duty should not exceed 9 hours and the total shift 11 hours [S20] (single news source, **UNVERIFIED** against HOER text). HOER 2005 gives rest rules, including 16 hours' rest at headquarters per union and summary sources [S20]. Unions dispute compliance [S20].
- **Penalty (design):** Fatigue meter: past the limit, reaction time slows and VCD prompts increase. Requesting relief in time gives a bonus.
- **Why this rule exists:** Tired drivers react slower and miss signals, so duty hours are capped.

---

## Uncertain / needs verification

1. **Fog limits:** 75 km/h with fog device is well reported [S7]; the 60/30 km/h automatic-block fog limits and 270 m detonator distance come from IRFCA's FAQ [S5], not official text.
2. **Water-over-rail speeds** (5/8/15 km/h by inches of water) come from IRFCA describing WR practice [S5]; other zones may differ.
3. **Wind thresholds** (40 km/h above 70 km/h wind; stop above 90 km/h) - zone and policy not identified [S23].
4. **Elephant corridor 45 km/h at night** - reported for specific Tamil Nadu/Kerala sections, not a national rule [S9].
5. **Automatic signal failure speed under written authority:** 10 km/h vs 15 km/h conflict across reports and the CRS Kanchanjunga probe [S10]; GR 9.02 itself sets 8 km/h when the view is restricted [S2].
6. **Hot axle bands** (140-200 C escort, >200 C detach) are from one SCR circular [S11].
7. **OHE entanglement LP sequence** (lower pantograph vs. call TPC first) not found.
8. **W/L whistle board meaning** ("whistle for level crossing") comes from a search snippet; the exact source document was not opened.
9. **Dust storm example (2018 Rajasthan/UP OHE breaks)** - from international news coverage in search results; not opened in full.
10. **Bridge 120 km/h vs 20 km/h violation** and Railway Board committee - from news reports (Outlook/Deccan Herald), not opened in full.
11. **Karjat brake test before Bhore ghat** - forum/Wikipedia only.
12. **Token exchange and loop entry speeds** on IR - not found; GR 4.10 default (15 km/h) used.
13. **Dead-end terminal approach speed** - no IR figure found.
14. **Wheel flat** handling - no IR LP procedure found.
15. **Stone pelting** - legal section varies (152 vs 153) across reports; no LP stop/continue rule found.
16. **Fire** - no published rule on not stopping on bridges/tunnels; SCR noted absence of an SOP for coach isolation under traction power (2023).
17. **Duty hours 9 h / 11 h** - one news source; check HOER 2005 text.
18. **GR 2.09 (no alcohol 8 h before duty)** - from secondary/Scribd material.
19. **Relief engine into obstructed block (SR 6.02)** - from a search snippet of an SR excerpt.
20. **Paper line clear / total communication failure 15 km/h** - IRFCA FAQ summary [S5].
21. **Detonator distances** differ by rule (6.03 BG 600/1,200 m; 9.10 automatic 90/180 m); unofficial notes give other patterns. Use the GR extracts [S3][S2] and confirm against the current GR with correction slips.
22. **Medical-emergency unscheduled stops** - no formal rule found.
23. **Landslide crew stop (Karnataka)** - headline-level source [S36].
24. **ACP penalty** - most reports say up to Rs 1,000 and/or 1 year (Section 141); some notices give lower figures [S12].
25. **General caveat:** IRFCA rulebook pages are extracts of an older GR edition. IR has issued many correction slips (e.g., SCR AS 17/18 to G&SR 2020). Before shipping rule text in-game, check against the current G&SR of the zone the route depicts.
