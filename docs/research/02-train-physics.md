# 02 — Longitudinal Train Physics (research notes)

Purpose: a realistic but game-friendly longitudinal dynamics model for "Indian Train", which runs a deterministic fixed-timestep (60 Hz) simulation in TypeScript.

Conventions:
- Every figure has a source URL. **UNVERIFIED** marks values I could not confirm from a primary or near-primary source; treat them as tuning starting points.
- Ranges are given in place of false precision.
- Indian practice expresses resistances in **kg/t**, meaning kgf per tonne of train weight. To convert: 1 kg/t = 9.81 N/t ≈ 0.00981 m/s² of deceleration-equivalent.
- Real loco class names (WAP-7, WAG-9 and so on) appear only as **reference data**. The game's locos are original and generic.

---

## 1. Tractive effort (TE), adhesion, wheel slip

### 1.1 TE–speed characteristic
Modern three-phase AC electric locos have a TE curve with two main regions:
1. **Constant TE**, from standstill up to the "base speed", capped by the adhesion and motor-current limits.
2. **Constant power** above base speed, where TE = P / v. This is a hyperbola.
3. Near maximum speed, some locos taper further (a field-weakening or speed-limit region).

Cross-check using WAP-7 reference data:
- Starting TE is 322.4 kN.
- Continuous TE is 228 kN at 71 km/h. That works out to 228 kN × 19.7 m/s ≈ 4.5 MW, which is consistent with the quoted continuous rating of about 4.56 MW (6,120 hp).
- Source: https://en.wikipedia.org/wiki/Indian_locomotive_class_WAP-7

Implied base speed for a WAP-7-like loco: 4.5 MW / 322 kN ≈ 14 m/s ≈ 50 km/h. For a WAG-9-like loco: 4.56 MW / 475 kN ≈ 9.6 m/s ≈ 35 km/h. Both are my own derivations from the cited numbers.

### 1.2 Adhesion limit
TE at the rail cannot exceed μ × W_adh, where W_adh is the weight on driven axles. For an all-axles-driven Bo-Bo or Co-Co loco, that is the full loco weight.

| Condition | μ (range) | Source / note |
|---|---|---|
| Dry rail, DC-motor loco | 0.22–0.25 | Rule of thumb in a railfan forum, so low authority: https://forum.trains.com/t/traction-rating-of-locomotives/243339 |
| Dry rail, modern AC loco with creep control | ~0.30–0.35 | Same forum (~33%). Research treats ~0.35 as a typical dry maximum: https://link.springer.com/article/10.1007/s11249-009-9560-1 |
| Wet rail | about 0.07–0.09 below dry, i.e. ~0.15–0.20. Brake designers use ~0.17 | Forum source above (UNVERIFIED as a standard) |
| Sanded | adds ~0.08 on wet rail. Little effect on dry rail | Forum source above. On sanding in dry vs wet conditions: https://eprints.whiterose.ac.uk/196136/1/lubricants-11-00038.pdf |
| Leaf-fall / contaminated | ~0.05–0.10 | UNVERIFIED (general literature) |

Implied μ at starting TE, as a sanity check:
- WAP-7: 322 kN / (123 t × 9.81) ≈ 0.27.
- WAG-9: 475 kN / (123 t × 9.81) ≈ 0.39. This is very high and shows what modern slip control can achieve.

**Curtius–Kniffler speed dependence.** Open Rails uses the form μ(v) = W × (A / (B + v_kmh) + C), where W is a weather factor. Source: https://open-rails.readthedocs.io/en/latest/physics.html

The commonly cited coefficients are A = 7.5, B = 44, C = 0.161. They give μ ≈ 0.33 at standstill, falling to ≈ 0.21 at 100 km/h. These coefficients are UNVERIFIED here; only the form is sourced.

### 1.3 Wheel slip (game-level)
- Open Rails models creep and slip. Beyond peak adhesion, slip runs away and the wheels overspeed.
- Its default slip-warning threshold is 70% of available adhesion.
- Source: https://open-rails.readthedocs.io/en/latest/physics.html

A simple game model:
- If the demanded TE exceeds μ·W_adh, enter a **slip** state.
- While slipping, transmitted TE falls to roughly 0.6–0.8 × μ·W_adh. This range is UNVERIFIED and is a tuning knob.
- Show the slip indicator, play the wheel-spin sound, and auto-reduce TE (modern locos) or require the player to notch back (older locos).
- Sanding multiplies μ by a factor.

---

## 2. Train (running) resistance

### 2.1 Davis form
- Resistance is R(v) = A + B·v + C·v². A is mechanical/rolling, B covers flange and other speed-proportional losses, and C is aerodynamic.
  - https://en.wikipedia.org/wiki/Rail_vehicle_resistance
  - https://journals.iium.edu.my/ejournal/index.php/proc/article/download/2982/937/18045
- The coefficients may be mass-specific (per tonne) or given per vehicle: https://wiki.railml.org/wiki/RS:trainResistance
- Open Rails uses Davis A/B/C per car with v in m/s, and treats Davis as reliable only above about 8 km/h (5 mph). Below that it applies a separate starting resistance: https://open-rails.readthedocs.io/en/latest/physics.html

### 2.2 Indian (RDSO-attributed) coefficients
Units are kg/t with V in km/h.

| Stock | R (kg/t) | Source |
|---|---|---|
| ICF all-coil coaches, loaded (BG) | 0.6854599 + 0.0211244V + 0.000082V² | RDSO haulage booklet, as shown in the search snippet: https://rdso.indianrailways.gov.in/uploads/files/PUB0002%20Rev_0%20for%20Haulage%20Capacity%20of%20Electric%20Locomotives.pdf (the PDF is scanned and I could not read it in full) |
| LHB passenger | 0.69873 + 0.021533V + 0.0000835V² | https://globalrailelectrica.com/traction-mechanics/train-grade-curve-and-acceleration-resistance-2/ (attributed to RDSO, not independently verified) |
| "Passenger" (older/generic) | 1.43 + 0.0054V + 0.000253V² | same page |
| Loco (WAP-5) | 1.34819 + 0.02153V + 0.00008358V² | same page |
| Loco, generic (Davis-type) | 0.647 + 13.17/w + 0.00933V + C'·V²/(w·n), where w is axle load (t) and n is the number of axles; the page's V² term is garbled | same page (partly UNVERIFIED) |
| BOXN empty | 1.333973 + 0.021983V + 0.000242V² | same page |
| BOXN loaded | 0.64388 + 0.010472V + 0.00007323V² | same page |
| Koffman (British coaches), for comparison | 1.1 + 0.021V + 0.000175V² | https://advanced-steam.org/ufaqs/rolling-resistance/ |

Worked example (my arithmetic): LHB at 130 km/h gives ≈ 0.70 + 2.80 + 1.41 = **4.9 kg/t ≈ 48 N/t**. A 24-coach LHB rake of about 1,000 t therefore needs about 48 kN, or about 1.7 MW at 130 km/h, before loco resistance.

### 2.3 Starting resistance
- Indian practice uses about **4 kg/t for the train** and **6 kg/t for the loco**: https://globalrailelectrica.com/traction-mechanics/train-grade-curve-and-acceleration-resistance-2/
- The RDSO booklet snippet gives 4 kg/t starting resistance for coaches: https://rdso.indianrailways.gov.in/uploads/files/PUB0002%20Rev_0%20for%20Haulage%20Capacity%20of%20Electric%20Locomotives.pdf
- Open Rails blends from a standstill-friction value into Davis at a "merge speed" (ORTSStandstillFriction / ORTSMergeSpeed): https://open-rails.readthedocs.io/en/latest/physics.html

### 2.4 Rotating-mass (inertia) factor
Effective mass = (1 + λ) × static mass. The source quotes K values of 1.2 for locos, 1.1–1.15 for EMUs and 1.03 for freight: https://globalrailelectrica.com/traction-mechanics/train-grade-curve-and-acceleration-resistance-2/

---

## 3. Gradient, curve and tunnel resistance

### 3.1 Gradient
- Grade resistance is W·sinθ ≈ W·G, where G = rise / run: https://globalrailelectrica.com/traction-mechanics/train-grade-curve-and-acceleration-resistance-2/
- On IR a grade of "1 in N" gives **1000/N kg/t**. For example, 1 in 200 = 5 kg/t ≈ 49 N/t, and 1 in 100 = 10 kg/t. This is my derivation.
- Ghat sections go steeper than 1 in 100. The steepest broad-gauge ghats are around 1 in 37. That figure is UNVERIFIED here; check it against a route-research doc.

### 3.2 Curve
- IR textbook rule: **R_curve ≈ 0.4 kg/t per degree of curvature**. The same rule written as 0.0004·D·W (tonnes) appears in exam material:
  - https://globalrailelectrica.com/traction-mechanics/train-grade-curve-and-acceleration-resistance-2/
  - https://www.madeeasy.in/Uploads/examsolution/689uf_CE-S-Railway.pdf
- Degree of curve on BG is D ≈ 1750 / R_m. Check: a 3° curve has R ≈ 583 m, per the globalrailelectrica example.
- Grade compensation on BG is 0.04% per degree or 70/R, whichever is less. This confirms the order of magnitude: https://www.madeeasy.in/Uploads/examsolution/ce-railway.pdf
- Open Rails uses a more physical model:
  - Base form (Allen 1912): R ∝ W·F·(gauge + rigid wheelbase)/(2r).
  - It is scaled by the deviation from equilibrium (cant) speed, with a 200% factor at start.
  - Source: https://open-rails.readthedocs.io/en/1.4/physics.html
  - This is overkill for us. The 0.4 kg/t/degree rule is enough.

### 3.3 Tunnel
- EN 14067-3 approach: multiply the aerodynamic (V²) Davis term by a **tunnel factor Tf ≥ 1**. Tf depends mainly on the blockage ratio (train area / tunnel area), and on tunnel length for tunnels under 2 km. Sources:
  - https://repositum.tuwien.at/handle/20.500.12708/190564
  - https://iteh.es/catalog/standards/sist/3b5db9af-1223-49f5-9901-445496516671/sist-en-14067-3-2004
- Open Rails implements an explicit tunnel-drag formula built on blockage ratio, tunnel perimeter and the length ratio. Its default single-track tunnel is about 27 m² area and 21.3 m perimeter for speeds under 120 km/h: https://open-rails.readthedocs.io/en/1.4/physics.html
- An NTNU study measured tunnel resistance per metre of train: 7.7 kg/m for small single-track tunnels and 4.1 kg/m for large double-track tunnels. It also found that simulation tools tend to overestimate tunnel resistance: https://ntnuopen.ntnu.no/ntnu-xmlui/handle/11250/2351208
- Game suggestion: Tf = 1.5–2.0 for single-track and 1.2–1.4 for double-track tunnels. These values are UNVERIFIED and are tuning values.

---

## 4. Air brakes (IR twin-pipe graduated-release) and electric braking

### 4.1 Pressures
| Item | Value | Source |
|---|---|---|
| Brake pipe (BP), charged / released | 5.0 kg/cm² | https://www.globalseamless.com/rdso-air-brake-specs/ and IRIMEE notes https://rskr.irimee.in/sites/default/files/Air%20brake%20sysyem.pdf (both via search snippets) |
| Feed pipe (FP) | 6.0 kg/cm² | same sources. SCR safety circular: https://scr.indianrailways.gov.in/cris//uploads/files/1749464741688-Fly%20Leaf%20No.%2008%20of%202025%20.pdf |
| BP / FP at brake van, trains up to 58 wagons | ~4.8 / ~5.8 kg/cm² | Ministry procedure, as summarised in search results (UNVERIFIED wording) |
| Max brake cylinder (BC), ICF / wagon distributor | 3.8 kg/cm² | IRIMEE/RDSO training notes via search: https://rskr.irimee.in/sites/default/files/Braking_System_Used_in%20Indian%20Railways_0.pdf |
| Max BC used in LHB EBD calculations | 3.0 kg/cm² | RDSO letter, 2018: https://rskr.irimee.in/forum/wp-content/uploads/2023/08/RDSO-letter-for-LHB-BC-pressure-variation-dated-20.04.2018.pdf |
| UIC distributor behaviour | BC caps at 3.8 bar once BP falls below about 3.5 bar | https://open-rails.readthedocs.io/en/latest/physics.html |
| Main reservoir (MR) | ~8–10 kg/cm² | UNVERIFIED |

Derived point: full service is a BP drop of about 1.5 kg/cm² (5.0 → ~3.5), which gives BC ≈ 3.8. So BC ≈ 2.5 × ΔBP, capped. This is my derivation from the UIC 3.5/3.8 figures above. Emergency vents BP to 0.

### 4.2 Timing and propagation
- **RDSO SMI 197** (via search snippet): https://rdso.indianrailways.gov.in/works/uploads/File/SMI%20197%20Rev_1(3).pdf
  - Passenger release: **10–15 s** for BC to fall to 0.4 kg/cm².
  - Goods application: **20–25 s** to reach 95% of BC.
  - Goods release: **25–30 s**.
- A general (non-IR) distributor standard cites application in **3–5 s** and release in **15–20 s**: https://jurnal.ppi.ac.id/jpi/article/view/93. Use 3–5 s for passenger application; this is UNVERIFIED for IR.
- **BP signal propagation**:
  - The physical limit is the speed of sound, about 340 m/s.
  - In practice, couplings and restrictions slow it to roughly **180–275 m/s**: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/3966272 (patent; figures converted from ft/s)
  - Service applications on long freight trains propagate much more slowly in effect. One patent cites 15 s or more to reach the 150th car, and over a minute in some cases.
  - One sim uses 150 m/s: https://www.railworksamerica.com/forum/viewtopic.php?p=159222
- **Open Rails defaults**:
  - BP charging at 21 psi/s.
  - BrakePipeTimeFactor 0.003 s per car-pair equalisation.
  - Service time factor 1.009 s and emergency time factor 0.1 s.
  - Source: https://open-rails.readthedocs.io/en/latest/physics.html

### 4.3 Brake power percentage
- Coaching stock should leave the originating station with **100%** brake power: https://rskr.irimee.in/sites/default/files/MCT%2002.pdf
- Vacuum goods trains on BG need **85%**. Air-braked close-circuit goods rakes need 100% at origin. Same source.
- On route, operative BC should not fall below **85%**: https://rdso.indianrailways.gov.in/works/uploads/File/SMI%20197%20Rev_1(3).pdf (via snippet)
- In game terms, brake % scales maximum brake force. Isolated cars reduce it.

### 4.4 Stopping distances and decelerations
| Case | Figure | Implied mean decel (my calculation) | Source |
|---|---|---|---|
| LHB/passenger spec, EBD from 160 km/h | ≤ 1200 m, max decel 1.3 m/s² | ~0.82 m/s² average | https://rdso.indianrailways.gov.in/works/uploads/File/Functional%20Requirements%20of%20SPC(1).pdf |
| 58 BOXN + WAG-5/WAG-7, 75 km/h, level | ~836–838 m | ~0.26 m/s² | RDSO TC-33 (1998), via snippet: https://rdso.indianrailways.gov.in/works/uploads/File/TC_33(1).pdf |
| 58 BOXN, 65 km/h, level | ~630 m | ~0.26 m/s² | same |
| 58 BOXN, 75 km/h, on falling grades | ~1000–1234 m | — | same (column headings unclear) |
| 58 BOXNHL (BMBS) trials at 75 / 85 / 95 km/h | 892 / 1162 / 1800 m | 0.24 / 0.24 / 0.19 m/s² | RDSO committee report, 2022: https://rskr.irimee.in/forum/wp-content/uploads/2023/08/RDSO_Final-Committee-Report-Brake-Power-BOXNHL-D.pdf |
| Disc brakes vs ICF tread brakes | ~30% shorter EBD | — | PIB 2003: https://archive.pib.gov.in/release02/lyr2003/raug2003/04082003/r040820031.html |
| ICF 24-coach at 110 km/h; LHB at 130 km/h | no primary figure found. Estimate ICF ~800–1000 m and LHB ~700–900 m | — | **UNVERIFIED** (derived from the decel range above) |

### 4.5 Dynamic / regenerative braking
- **WAG-9** regen is at least 260 kN from 10 to 62 km/h and stays near 260 kN at higher speeds: https://en.wikipedia.org/wiki/Indian_locomotive_class_WAG-9
  - At 62 km/h, 260 kN × 17.2 m/s ≈ 4.5 MW, so above that speed regen is effectively power-limited (my derivation).
- **WAP-5 / WAG-9 braking notes**:
  - Electric brake effort ramps linearly from full at 10 km/h to **0 kN at standstill**.
  - When regen exceeds about 10 kN, the automatic loco air brake is cut out, so the loco itself does not double-brake.
  - Source: https://www.irfca.org/docs/wap5-wag9-brakes.doc
- **WAP-7** regen effort: not published in the sources I found. Assume 180–260 kN (**UNVERIFIED**).
- Open Rails blends dynamic and air braking, with a minimum blending speed of about 8 km/h by default: https://open-rails.readthedocs.io/en/latest/physics.html

---

## 5. Reference figures (for generic, original locos and stock)

| Item | Power | Max/starting TE | Mass | Vmax | Source |
|---|---|---|---|---|---|
| WAP-7-like (AC passenger, Co-Co) | 4.74 MW max, 4.56 MW continuous | 322 kN start; 228 kN at 71 km/h | 123 t (20.5 t axle) | 140 km/h; hauls 24 coaches at 130 km/h | https://en.wikipedia.org/wiki/Indian_locomotive_class_WAP-7 |
| WAG-9-like (AC freight, Co-Co) | 4.56 MW | 475 kN (510 kN for the 132 t "H" variant) | 123 t (20.5 t axle); 132 t (22 t axle) | 100 km/h | https://en.wikipedia.org/wiki/Indian_locomotive_class_WAG-9 |
| WDP-4D-like (diesel passenger) | 4,500 hp (3.36 MW) engine; rail power lower, about 80–90% (UNVERIFIED) | ~429 kN (as listed) | ~120 t (axle ~20.2 t, UNVERIFIED) | 135 km/h | https://en.wikipedia.org/wiki/Indian_locomotive_class_WDP-4 |
| WDG-4-like (diesel freight) | 4,000–4,500 hp | 540 kN (another source says 570 kN) | ~126 t (axle ~21 t, UNVERIFIED) | ~100–105 km/h (UNVERIFIED) | https://en.wikipedia.org/wiki/Indian_locomotive_class_WDG-4 , https://24coaches.com/?p=910 |
| LHB coach | — | — | tare ~39.5–42 t (AC chair car 39.5–40.3 t); length 23.54 m body, 24 m over couplers | 160 km/h design | https://en.wikipedia.org/wiki/LHB_coach , https://rskr.irimee.in/sites/default/files/LHB%20DESIGN%20FEARURE.pdf |
| BOXN wagon | — | — | tare 22.47 t, payload 58.81 t, gross 81.28 t (20.32 t axle) | 75–80 km/h (BOXN-HS 100) | https://irfca.org/faq/faq-stock2.html |
| BOXNHL wagon | — | — | tare 20.6 t, payload 71.0 t, gross 91.6 t (22.9 t axle) | — | https://www.titagarh.in/service/railway-freight/rolling-stock/box-wagons |
| Typical rakes | Passenger: 22–24 coaches (24 at 130 km/h with WAP-7). Freight: **58 BOXN** ≈ 58 × 81.28 ≈ 4,700 t trailing. RDSO passenger load basis: 30 ICF ≈ 1650 t | — | — | — | WAP-7 page above; TC-33 and the twin-pipe procedure (58 wagons); RDSO PUB0002 via snippet |

---

## 6. Passenger comfort metrics
| Metric | Value | Source |
|---|---|---|
| Jerk limit, service braking (DIN EN 13452-1, urban rail) | **1.5 m/s³** | patent citing the standard: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9580052 |
| Free-standing passenger tolerance | ~0.6 m/s², 1 m/s³ | https://www.thecontactpatch.com/book/general/g0216-passengers-in-motion (table quoting a third-party source) |
| Standing, holding a handhold | ~2.0 m/s², 3 m/s³ | same |
| Seated | ~3.5 m/s² | same |
| Standing-passenger discomfort threshold | ~0.1 g (0.98 m/s²) is OK; 0.12 g is uncomfortable | Powell & Palacín 2015: https://link.springer.com/doi/10.1007/s40864-015-0012-y |
| Lateral comfort targets | <1.0 m/s² urban, <0.5 m/s² intercity | contact-patch page |

Game use:
- Score a "smooth driving" metric. Penalise |a| > 1.0 m/s² and |jerk| > 1.0–1.5 m/s³.
- Use a stronger penalty for station stops that are not smooth.
- Ignore emergency applications in comfort scoring, or flag them separately.

---

## 7. Numerical integration at a fixed 60 Hz step

- Fixed-timestep accumulator pattern: https://gafferongames.com/post/fix_your_timestep/
- **Semi-implicit (symplectic) Euler**: update v first, then x using the new v. It is cheap and stable for this first-order-dominant system: https://perso.liris.cnrs.fr/nicolas.pronost/UUCourses/GamePhysics/lectures/lecture%205%20Numerical%20Integration.pdf
  - Open Rails defaults to RK4 with sub-steps for its adhesion model (https://open-rails.readthedocs.io/en/latest/physics.html). We do not need that unless we model axle creep dynamics.
- **Dissipative forces must never reverse motion.**
  - Brakes, rolling resistance and starting resistance are friction-like. Cap them so they can at most bring v to 0 within the step: |F| ≤ m·|v|/dt. Sources:
    - https://gamedev.net/forums/topic/624172-framerate-independent-friction/4937160/
    - https://box2d.org/files/ErinCatto_SequentialImpulses_GDC2006.pdf
  - At standstill, use a Karnopp-style velocity threshold or stiction rule: https://home.hiroshima-u.ac.jp/kikuuwe/pub/06_tro.pdf
- **Determinism notes** (engineering advice, not sourced figures):
  - Use only +, −, ×, ÷ and `Math.sqrt` in the sim core. These are IEEE-754 correctly rounded.
  - Avoid `Math.sin/exp/pow` in the sim path, because results can differ across JS engines. Use lookup tables or polynomials.
  - Process cars in a fixed order. Keep randomness out of the sim, or use a seeded PRNG.
  - Store sim time as an integer tick count.

---

## 8. Open-source references (ideas only; do not copy code)
| Project | License | Notes |
|---|---|---|
| Open Rails | Code: **GPL v3 or later** (adopted May 2013). Docs: **CC BY-SA** | Extensive physics manual: Davis, Curtius–Kniffler adhesion, curve and tunnel resistance, air-brake time factors, dynamic-brake blending. https://openrails.org/discover/license/ , https://open-rails.readthedocs.io/en/latest/physics.html . GPL means we must not copy code into our project. Read for ideas only. |
| OpenBVE | Legacy code was declared **public domain** by its founder. New code is **BSD-2**. Third-party libraries carry mixed licenses (MIT, Ms-PL, Apache-2, LGPL-3 and others). The relicensing status of the legacy code is noted as unsettled. | https://github.com/leezer3/OpenBVE , https://openbve-project.net/copyright/ |
| railML trainResistance schema | Spec docs | Useful for a data-model shape (Davis, tunnel factor): https://wiki.railml.org/wiki/RS:trainResistance |

---

## Recommended model for the game

### State (per train; single-mass "rigid train" for v1)
- Position s (m) along the route and signed velocity v (m/s), positive = forward along the route. Rollback gives v < 0; dir = reverser setting (±1).
- Controls:
  - Throttle notch n ∈ [0, N].
  - Dynamic brake d ∈ [0, 1].
  - Automatic brake handle, which sets the target BP.
  - Independent loco brake.
  - Sander on/off.
- Brake state per car, or per group of about 4 cars for performance: BC pressure p_bc,i (kg/cm²).
- Optional v2: a multi-mass train with spring-damper couplers for slack and in-train forces. Keep the force functions below per car so the upgrade is trivial.

### Forces (SI: N, kg, m/s)
1. **Traction** (loco):
   - F_te = min( T·F_max , T·P_max / max(v, v_ε) , μ(v)·k_sand·m_adh·g )
   - T = n/N is the throttle fraction. Option: ramp T at ≤ 0.2–0.5 /s, so TE rises smoothly the way real loco electronics behave.
   - Adhesion: μ(v) = W_weather · (7.5/(v_kmh + 44) + 0.161). The coefficients are UNVERIFIED; the form comes from Open Rails.
   - Slip: if the demanded TE exceeds the adhesion term, set slip = true and F_te = 0.7 × the adhesion term until the demand is reduced.
2. **Running resistance** (per vehicle, converted from kg/t):
   - F_r = m_t · 9.81 · (a + b·V + c·V²), with V in km/h and m_t in tonnes.
   - In a tunnel, multiply the c-term by Tf.
   - Below 8 km/h, blend linearly toward the starting resistance (4 kg/t for trailing stock, 6 kg/t for the loco) at v = 0.
3. **Gradient**: F_g = m · g · G, where G = 1/N for "1 in N" (positive when rising). Integrate per car, or use the length-weighted average grade under the train.
4. **Curve**: F_c = m_t · 9.81 · 0.4 · D, where D = 1750 / R_m degrees (BG). Average over the curved length under the train.
5. **Air brake** (per car i):
   - BP target: running 5.0 kg/cm²; minimum service reduction ~0.5; full service ~3.5; emergency 0.
   - BP propagation: each car sees the change after a delay of x_i / c_bp, with c_bp ≈ 200 m/s for emergency and slower for service (≈ 60–150 m/s; UNVERIFIED tuning). Alternatively, use the Open Rails per-car time-factor approach.
   - Target BC: p_bc* = clamp(2.5 · (5.0 − p_bp), 0, p_bc,max), with p_bc,max = 3.8 (ICF/wagon) or 3.0 (LHB).
   - BC dynamics: first-order lag toward p_bc*.
     - Passenger: τ_apply ≈ 1–1.5 s (95% in 3–5 s); τ_release ≈ 4 s (10–15 s).
     - Goods: τ_apply ≈ 7 s (95% in 20–25 s); τ_release ≈ 9 s (25–30 s).
     - Graduated release lets the BC follow p_bc* both up and down.
   - Brake force: F_b,i = η_bp · (p_bc,i / p_bc,max) · β · m_i · g.
     - η_bp is the brake-power fraction (0.85–1.0).
     - β is the full-service "braking ratio" expressed as an equivalent decel/g. Tune it to the targets below.
6. **Dynamic/regen brake** (loco):
   - F_db = d · min(F_db,max , P_db,max / v) · ramp(v), where ramp = clamp(v_kmh/10, 0, 1).
   - Cut the loco air brake when F_db > 10 kN, as on the WAP-5/WAG-9.

Calibration targets for β:
- **LHB passenger, full emergency**: mean decel ≈ 0.8–1.0 m/s², peak ≤ 1.3 m/s². This gives ≤ 1200 m from 160 km/h.
- **Passenger full service**: ≈ 0.5–0.7 m/s² (UNVERIFIED tuning).
- **Loaded BOXN freight, emergency**: ≈ 0.25 m/s². This gives ~840 m from 75 km/h.
- **Freight full service**: ≈ 0.15–0.2 m/s² (UNVERIFIED).

### Integration step (dt = 1/60 s), semi-implicit Euler with stiction
```
M_eff   = Σ m_i · (1 + λ_i)                 // λ: 0.2 loco, 0.03–0.08 coaches/wagons
F_drive = dir·F_te − F_g                     // signed "active" forces (traction, gravity), +ve = forward
F_diss  = F_r + F_c + Σ F_b,i + F_db + F_ind  // magnitudes, always oppose current motion
if |v| > v_eps:
    v_drive = v + (F_drive / M_eff)·dt                       // active forces may reverse v (rollback)
    dv_diss = min(F_diss / M_eff · dt, |v_drive|)            // cap: dissipation stops, never reverses
    v = v_drive − sign(v_drive)·dv_diss
else: // at rest (|v| <= v_eps)
    F_static_max = F_r_start + F_c + Σ F_b,i + F_ind_brake
    if |F_drive| <= F_static_max: v = 0  (held; no creep)
    else: a = (|F_drive| − F_static_max)/M_eff in direction of F_drive; v += a·dt
s += v·dt
```
- Use v_eps ≈ 0.01 m/s. Track direction explicitly, so that a train held by brakes on a 1-in-100 grade stays put, and an unbraked train rolls back down the grade.
- Compute jerk as (a − a_prev)/dt, smoothed with a 0.5 s moving average, for the comfort score.

### Parameter table
| Parameter | Unit | Value / range | Source |
|---|---|---|---|
| Electric passenger loco mass | t | 120–125 | WAP-7 Wikipedia |
| Passenger loco power at rail | MW | 4.5 (max 4.7) | WAP-7 Wikipedia |
| Passenger loco starting TE | kN | 300–325 | WAP-7 Wikipedia |
| Passenger loco Vmax | km/h | 130–140 | WAP-7 Wikipedia |
| Electric freight loco mass | t | 123–132 | WAG-9 Wikipedia |
| Freight loco power | MW | 4.5 | WAG-9 Wikipedia |
| Freight loco starting TE | kN | 450–510 | WAG-9 Wikipedia |
| Freight loco Vmax | km/h | 100 | WAG-9 Wikipedia |
| Regen brake max (freight loco) | kN | ≥ 260, power-limited above ~62 km/h, linear to 0 below 10 km/h | WAG-9 Wikipedia; IRFCA WAP5/WAG9 doc |
| Regen brake max (passenger loco) | kN | 180–260 | **UNVERIFIED** |
| Diesel passenger loco | MW, kN, t | 3.0–3.4 engine (rail ~2.7–3.0), ~400 kN, ~120 t | WDP-4 Wikipedia (rail power and mass UNVERIFIED) |
| Diesel freight loco | MW, kN, t | 3.0–3.4, 540 kN, ~126 t | WDG-4 Wikipedia (mass UNVERIFIED) |
| LHB coach mass | t | 40–44 tare (+~5 t passengers, UNVERIFIED) | LHB Wikipedia; IRIMEE |
| LHB coach length | m | 24.0 over couplers | LHB Wikipedia |
| BOXN loaded / empty | t | 81.3 / 22.5 | IRFCA FAQ |
| Wagon length over buffers | m | ~10.7 | **UNVERIFIED** |
| Rake size | cars | 24 coaches; 58 wagons (~4,700 t) | WAP-7 Wikipedia; RDSO TC-33 |
| μ dry / wet / sanded-wet | — | 0.30–0.35 / 0.15–0.20 / +0.05–0.08 | trains.com forum; Springer tribology paper (low-authority mix) |
| Davis, LHB | kg/t, V km/h | 0.699 + 0.02153V + 0.0000835V² | globalrailelectrica (RDSO-attributed) |
| Davis, ICF | kg/t | 0.685 + 0.02112V + 0.000082V² | RDSO PUB0002 (snippet) |
| Davis, BOXN loaded | kg/t | 0.644 + 0.01047V + 0.0000732V² | globalrailelectrica |
| Davis, BOXN empty | kg/t | 1.334 + 0.02198V + 0.000242V² | globalrailelectrica |
| Davis, electric loco | kg/t | 1.348 + 0.02153V + 0.0000836V² | globalrailelectrica (WAP-5) |
| Starting resistance | kg/t | 4 (train), 6 (loco) | globalrailelectrica; RDSO PUB0002 |
| Rotating mass factor λ | — | 0.2 loco, 0.03 freight, ~0.05–0.1 coaches | globalrailelectrica (coach value UNVERIFIED) |
| Grade resistance | kg/t | 1000/N for "1 in N" | derived |
| Curve resistance | kg/t per degree | 0.4; D = 1750/R | globalrailelectrica; MadeEasy |
| Tunnel factor on C-term | — | 1.5–2.0 single track, 1.2–1.4 double track | EN 14067-3 concept (values UNVERIFIED) |
| BP / FP | kg/cm² | 5.0 / 6.0 | IRIMEE / RDSO notes; SCR circular |
| Max BC | kg/cm² | 3.8 (ICF/wagon), 3.0 (LHB) | IRIMEE; RDSO letter 2018 |
| Full-service BP reduction | kg/cm² | ~1.5 (BP 5.0 → 3.5) | Open Rails (UIC distributor note) |
| BC application time (95%) | s | 3–5 passenger; 20–25 goods | Indonesian journal (UNVERIFIED for IR); RDSO SMI 197 |
| BC release time | s | 10–15 passenger; 25–30 goods | RDSO SMI 197 |
| BP propagation speed | m/s | 180–275 emergency; slower in service | US patents |
| Emergency decel (LHB) | m/s² | mean 0.8–1.0, peak ≤ 1.3 | RDSO SPC functional requirements |
| Emergency decel (loaded BOXN) | m/s² | ~0.25 | RDSO TC-33; RDSO BOXNHL report |
| Brake power % | % | 100 passenger (origin); 85–100 goods | IRIMEE MCT 02 |
| Comfort: accel | m/s² | target ≤ 1.0 (standing ≤ 0.6 ideal) | Powell & Palacín; contact-patch |
| Comfort: jerk | m/s³ | ≤ 1.0–1.5 | DIN EN 13452-1 via patent; contact-patch |
| Sim step | s | 1/60, semi-implicit Euler, dissipative-force cap m·v/dt | Gaffer; Box2D/Catto |

### Known gaps (to verify later)
- The RDSO PUB0002 and TC-33 PDFs are scanned or compressed and could not be read in full. The coefficients here come from search snippets and a secondary blog.
- There is no primary source for ICF at 110 km/h or LHB at 130 km/h stopping distances. Calibrate to the decel ranges above instead.
- The WAP-7 regen curve, diesel loco masses and Curtius–Kniffler constants are UNVERIFIED.
