# 08 - Educational incident scenarios (research for "Indian Train")

Compiled 2026-11-03. Everything is paraphrased; quotes are under 15 words. **UNVERIFIED** marks anything not confirmed in a primary or reputable source. Tone: factual and non-graphic. No real incident is to be recreated; use neutral, fictional causes.

**Source key** (same tiers as `01-signalling-rules.md`)
- **[GR]** General Rules 1976 text as reproduced by IRFCA (older consolidated copy; zonal G&SR 2020 and later slips may differ).
- **[Act]** Railways Act 1989 bare-act mirrors (advocatekhoj). Confirm against India Code before shipping rule text.
- **[Parl]** Lok Sabha / Rajya Sabha answers. **[News]** press. **[Study]** unofficial exam or forms pages (weak).
- Several official hosts (eparlib, IRFCA FAQ pages) blocked direct fetch in this session; where a fact comes via a search summary it is marked **UNVERIFIED-read**.

Game-wide principle (all five): the sim stays deterministic; incidents are scripted events on sim time and seeded RNG, never real-time randomness.

---

## 1. Medical emergency on a running train

**What the LP sees/hears**
- Usually nothing directly. The LP learns by radio or phone from the guard or control, or by the alarm-chain lamp and buzzer if a passenger pulls the chain (see `IMMERSION_IDEAS.md` 7.3 for the ACP sequence; do not duplicate it here).
- Valid reasons for using the chain include a medical emergency ([Curly Tales](https://curlytales.com/india/trending/indian-railways-alarm-chain-rules-when-can-you-pull-it-and-whats-the-penalty/), [News]). A genuine chain pull for this reason is not an offence under s.141 (see `IMMERSION_IDEAS.md`, C21).

**How it is reported**
- Passenger or co-passenger tells the TTE / Train Superintendent / guard, or calls the integrated helpline **139** (Rail Madad). Pressing 1 reaches a call-centre executive for security and medical help ([ETV Bharat](https://etvbharat.com/english/bharat/railway-ministry-launches-number-onerailonehelpline139/na20210308223701080), [News]; helpline consolidation in 2020-21 per the same report set). Press accounts show a 139 call leading to railway staff meeting the passenger ([Hitavada, Mar 2026](https://www.thehitavada.com/Encyc/2026/3/14/railways-provides-timely-medical-assistance-to-ailing-woman-passenger-.html)).
- Official chain (Lok Sabha answers, 2007-2008, via search summary, **UNVERIFIED-read**): for serious cases the Train Superintendent or TTE informs the Station Master of the next station, who may call a railway, government or private doctor; the patient is detrained where facilities exist and referred to the nearest hospital ([Parl 2008](https://eparlib.nic.in/bitstream/123456789/550042/1/49775.pdf), [Parl 2019 on first-aid training](https://eparlib.nic.in/bitstream/123456789/954111/1/AU3943.pdf)).
- A doctor travelling as a passenger is asked first (press, **UNVERIFIED** as a written rule).

**What the LP must do**
- Keep running to the next station unless the guard or control orders otherwise; do not stop in the open section for a medical case unless the chain is pulled or control directs it. Rule text for this is not in the sources read: **UNVERIFIED**.
- If the LP does stop (chain), apply the ACP sequence, then restart only after reset and BP recharge.
- Acknowledge control's instruction for an **unscheduled stop** at the next station and tell the SM the train needs a longer halt. GR 6.07 requires drivers to advise control of unusual circumstances affecting safe working ([GR 6.07, via fetch of IRFCA accidents chapter](https://irfca.org/docs/rulebook/gr-accidents.html)); the medical case is not named there, so applying it is a design inference.

**Guard / SM / control**
- Guard or TTE locates a doctor aboard, gives first aid and passes details to control. Control alerts the next station; the SM arranges a doctor, stretcher and ambulance (Parl, **UNVERIFIED-read**).
- The SM may not give a stopping instruction on his own that conflicts with signals; the train still enters on the Home signal's aspect and stops at the platform ([GR 5.01(4)](https://www.irfca.org/docs/rulebook/gr-stations.html): only the SM gives or asks for Line Clear / authority).

**Rule / law**: no statute governs the stop. Helpline 139 is Rail Madad. Typical halt time and number of minutes: **UNVERIFIED**.

**Why this rule exists**: a short, planned stop where a doctor is waiting gets care sooner than stopping in a field where nobody can reach the patient.

---

## 2. Cattle or a person near the track (open line / level crossing)

**What the LP sees/hears**
- A figure or animals on or beside the line, ahead of a whistle board ("W" / "W/L"; about 250 m before unmanned LCs and poor-view manned LCs, 600 m also quoted, **UNVERIFIED**, see `01` section 7).
- Frequent places: fenced-gap crossings, villages beside the line. Fencing has been provided over thousands of km, with locals breaking it in places ([The Statesman](https://www.thestatesman.com/india/1-20-lakh-cattle-fell-prey-to-train-accidents-in-four-years-1503153887.html), [News]; 6,191 km fencing per Parl, **UNVERIFIED-read**).

**What the LP must do**
- Sound the horn: a very long whistle for an LC or tunnel; repeated short blasts mean danger ([IRFCA whistle codes](https://irfca.org/faq/faq-signal5.html), via `01` section 10). No separate official whistle code for animals was found: **UNVERIFIED**.
- Reduce speed and be ready to stop short. Press reports show LPs honking, then stopping to clear animals ([News Minute](https://www.thenewsminute.com/amp/story/kerala/loco-pilot-halted-train-save-two-cows-kindness-captured-camera-142086)). A numeric speed for "animals ahead" is **UNVERIFIED**; the general duty is control and stopping short of any obstruction ([GR 5.09(5)](https://www.irfca.org/docs/rulebook/gr-stations.html) wording for obstructed lines; the open-line analogue is not read).
- If the train strikes an animal, stop only as practicable; the train resumes after a check of the loco and train (Vande Bharat press case, [News](https://uniindia.com/ap-vande-bharat-train-hits-two-cows-on-railway-track/south/news/3868859.html)). Cattle carcass clearance can delay movement for hours ([India Infra Hub](https://indiainfrahub.com/news/cattle-menace-affecting-train-operation-as-railways-witnesses-over-26000-cattle-run-over-cases-this-fiscal/), [News]).
- At an LC: gates default to closed to road traffic and the gateman must show a Stop hand signal if open ([GR 16.03](https://irfca.org/docs/rulebook/gr-lc.html), via `01`).

**After the event**
- LP reports location and nature to the nearest station or control as soon as possible ([GR 6.05 / 6.07](https://irfca.org/docs/rulebook/gr-accidents.html)). Brake-power or damage check, then logbook entry. Reporting forms for cattle: **UNVERIFIED**.
- Guard and SM: SM informs control; RPF may register a case against cattle owners (press: [The Statesman](https://www.thestatesman.com/india/1-20-lakh-cattle-fell-prey-to-train-accidents-in-four-years-1503153887.html)).

**Rule / law**
- Trespass, **Railways Act s.147(1)**: entering a railway without lawful authority, misusing it, or refusing to leave when required. Up to six months' imprisonment, a fine up to Rs 1,000, or both; proviso: minimum fine Rs 500 unless the court records reasons. s.147(2): a railway servant or anyone called to assist may remove the person ([Act s.147](https://www.advocatekhoj.com/library/bareacts/railways/147.php)). Verified in the bare-act mirror; re-check on India Code.
- **s.154**: reckless or careless act, or omission of a legal duty, that endangers people travelling or present on a railway; up to one year, a fine, or both ([Act s.154](https://www.advocatekhoj.com/library/bareacts/railways/154.php)). Press links cattle-owner liability to s.154; court practice **UNVERIFIED**.
- **s.160**: opening or breaking a gate, chain or barrier at an LC closed to road traffic carries imprisonment (up to three years / five years respectively, per the mirror) ([Act s.160](https://www.advocatekhoj.com/library/bareacts/railways/160.php)).

**Why this rule exists**: a train needs far more distance to stop than a person or animal needs to cross, so the only safe lever is warning early and keeping people off the line.

---

## 3. Rail fracture or track defect reported ahead

**What control tells the LP**
- Control or the SM relays that engineering staff or a previous train reported a defect, and the LP is told a stop or a reduced speed over the spot. Exact wording and the speed are not in a source read: **UNVERIFIED**.
- Drivers are required to tell the Controller of unusual conditions; the Controller must inform maintenance staff ([GR 6.07(1)-(2)](https://irfca.org/docs/rulebook/gr-accidents.html)). No GR rule specifically covering a driver-spotted fracture was found.

**What the LP must do**
- Normal case: obey the caution order / speed board (caution order given at the station short of the site; green paper; [GR 4.09](https://irfca.org/docs/rulebook/gr-general.html), via `01`).
- Defect that cannot be passed: stop short of the site. Engineering emergency signals (see `01` section 5, GR 15.09): a stop requirement of up to a day uses a banner flag at 600 m, three detonators 10 m apart at 1200 m (BG), and a Stop hand signal 30 m from the site.
- In fog, detonators go 270 m in rear of the first stop signal and signal-posts mark the spot (IRFCA, see `01` section 6). Detonator "bang" means stop and proceed with caution; the exact post-detonation speed is not in the sources read: **UNVERIFIED**.
- If the LP cannot proceed: whistle to the guard, exchange Stop hand signals, and protect front and rear ([GR 6.03](https://irfca.org/docs/rulebook/gr-accidents.html)); detonators one at 600 m and three at about 1200 m on BG.

**Engineering response**
- Permanent Way Manual material (unofficial copy, [Scribd extract](https://www.scribd.com/document/797851295/Chapter-6), **UNVERIFIED-read**): engineering staff, including keepers of engineering LCs, can attend rail fractures and weld failures, put in fish-plates or screw clamps as emergency repair, then issue a fit certificate. Normal speed returns only after permanent repair.
- Lok Sabha answer: fractured rails are replaced as early as possible; until then trains pass with a speed restriction after securing the spot ([Parl, via search summary](https://eparlib.nic.in/bitstream/123456789/592256/1/95810.pdf), **UNVERIFIED-read**).
- A press case reports a caution board of 10 km/h for 100 m on each side of a repaired weld (see [Better India](https://thebetterindia.com/114237/loco-pilots-alertness-helped-avert-major-train-accident-andhra-pradesh), News); treat 10 km/h as a design default, not a rule. Fix time press examples: about 90 minutes (same source).
- Scale: 23 consequential accidents from rail fracture in three years, per a parliamentary answer ([Parl AU2829, via search summary](https://eparlib.sansad.in/bitstream/123456789/2994575/1/AU2829_umSPxV.pdf), **UNVERIFIED-read**).

**Guard / SM / control**: the guard protects the rear if stopped; the SM keeps following trains held; control dispatches engineering staff.

**Rule / law**: GR 6.03, 6.07, 15.09, 4.09 as cited. "Stop and proceed" as a formal term: **UNVERIFIED**.

**Why this rule exists**: a cracked rail can open under the next wheel, so a train is either stopped or slowed enough that the track can be inspected and held together.

---

## 4. Signal failure / long hold at a home signal, crowd building on the platform

**What the LP sees/hears**
- A Home signal that stays red (or dark) with a platform ahead visible and filling up. Nothing is announced to the cab; the LP waits.

**What the LP does while held at danger**
- A stop signal at ON must not be passed without authority ([IRFCA signal FAQ](https://irfca.org/faq/faq-signal2.html), via `01`).
- Automatic signal (A marker): stop, wait 1 minute by day or 2 minutes by night, whistle and exchange signals with the guard, then proceed with great caution (GR 9.02, via `01`).
- Manual stop signal at ON (not automatic): the LP never passes it on his own. The SM gives a written authority form, T/A 912 (the form that authorises passing a defective stop signal; [Study: Eastern Railway form](https://www.scribd.com/document/634266555/FORMS), plus [The Week](https://www.theweek.in/wire-updates/national/2024/06/22/des8-rail-ecr-circular.html)). The form number is secondary-sourced: **UNVERIFIED-primary**.
- Held without apparent cause at a first stop signal: whistle after 5 minutes so staff warn the SM; after 15 minutes the guard protects the rear ([GR 4.44](https://irfca.org/docs/rulebook/gr-general.html), via `01`).
- Written authority and a pilot for a signalled line: GR 5.09(2)(c) / 5.10(1)(d) describe authority delivered by a competent railway servant who pilots the train ([GR 5.09-5.10](https://www.irfca.org/docs/rulebook/gr-stations.html)); that text is for obstructed or non-signalled lines and is not the same as T/A 912 (design inference).

**Speed: sources conflict**
- ECR circular as reported on 22 Jun 2024: T/A 912 not to be issued for automatic-signal failure till further advice; GR 9.02 applies, with a cap of **15 km/h if the view is clear and 10 km/h if obstructed** ([The Week](https://www.theweek.in/wire-updates/national/2024/06/22/des8-rail-ecr-circular.html), News).
- The Wire: 15 km/h under the T/A 912 authority ([The Wire](https://thewire.in/news/probe-blames-kanchanjunga-express-accident-on-operational-lapses-failure-of-signalling-system)). Another report: 10 km/h ([Study](https://www.scribd.com/document/634266555/FORMS)). GR text read in `01`: "8 km/h" cap only for poor visibility. Resolution: the likely logic is 15 km/h with a clear view, 10 km/h (or 8 in poor visibility) otherwise. All **UNVERIFIED-primary**; make speed configurable.

**SM / control**
- Only the SM asks for or gives authority to proceed ([GR 5.01(4)](https://www.irfca.org/docs/rulebook/gr-stations.html)). The SM must report signal defects immediately (GR 5.01(2)). Signal maintainers are called; control re-plans.
- Delay reasons passengers hear in announcements: the exact standard wording is not documented. Announcement fragment design (opener, number, name, status, platform) is in `IMMERSION_IDEAS.md` 7.2. Wording such as "late due to signalling failure" is **UNVERIFIED**; keep it neutral.

**Rule / law**: SPAD = passing a stop signal at ON without authority; consequences in `01` section 4 (punishment norms 1999; revisions UNVERIFIED).

**Why this rule exists**: a red signal is the only thing that tells the LP the line ahead may be occupied, so only a named person with a written, time-stamped order may override it.

---

## 5. Missing child at a station

**What the LP sees/hears**
- Nothing in the cab. Passengers on the platform hear announcements. The LP's concern is only whether the train is held.

**Station practice**
- A passenger who finds a child alone is advised to inform the RPF or station staff straight away ([Ferozepur division, AIR](https://newsonair.gov.in/indian-railways-reunites-65-lost-children-with-families-under-operation-nanhey-farishtey/), official broadcaster). Public-address announcement wording and repetition: **UNVERIFIED** (no written format found).
- Railway Children India describes the GRP and RPF as the responders: act on the information, gather details, make a Daily Diary entry, arrange a medical check, hand over to the Child Welfare Committee via NGOs ([RCI](https://railwaychildren.org.in/blog/indian-railways-and-rci-a-collaboration-for-the-safety-of-children), NGO).
- Helplines: **1098** (Childline) is on the New Delhi station kiosk; a 2015 MoU between the railway and child-welfare ministries led to a notified SOP for children in contact with railways ([Taxheal, on the 2015 launch](https://www.taxheal.com/?p=3836), secondary). Konkan Railway lists "182 or 1098" for a child in need of care ([Konkan Railway](https://konkanrailway.com/en/node/3680)). The Ferozepur notice gives **139** for children's safety (AIR link above). Since 182 was merged into 139 (see section 1 source), prefer 139 plus 1098; **UNVERIFIED** that every number works at every station.
- Pune press case: a 5-year-old traced within ten minutes by RPF and TTE ([Punekar News](https://www.punekarnews.in/?p=241653), News).

**Are trains held?**
- No source says a train is held for a missing child. Holding trains is controlled by the SM and control (GR 5.01(4)); departure needs the SM's permission ([GR 4.35](https://irfca.org/docs/rulebook/gr-general.html)). Game default: trains run to timetable; if the child may be aboard, the RPF checks at the next stop. **UNVERIFIED**.

**Why this rule exists**: a lost child is safest with trained uniformed staff in a known place, and a single advertised number lets passengers find them quickly.

---

## Summary table

| Scenario | Decision the player can make | Correct response | Rule / source | UNVERIFIED items |
|---|---|---|---|---|
| 1 Medical emergency | Stop in the section, or run to the next station | Run on unless the chain is pulled or control orders a stop; confirm the unscheduled stop and platform | Parl answers (via summary); 139 per ETV Bharat; GR 6.07 | Whether a stop in section is allowed; halt time; doctor-passenger rule |
| 2 Cattle / person | Horn early, brake, or ignore | Long horn at LC / whistle board; reduce speed; stop short; report after | IRFCA whistle codes; GR 6.07; Act s.147, s.154 | Animal whistle code; reduced speed value; reporting form |
| 3 Rail fracture / defect | Pass at line speed, crawl, or stop | Stop or crawl per control or caution order; protect train; call engineering; wait for fit certificate | GR 6.03, 6.07, 15.09, 4.09; PWM (unofficial) | "Stop and proceed" term; 10 km/h value; exact PWM clause |
| 4 Signal failure | Pass the red, wait, or call SM | Wait; get written authority from the SM; proceed at 15 / 10 / 8 km/h by visibility | GR 9.02, 5.01; ECR circular via The Week; The Wire | T/A 912 form number; 10 vs 15 km/h; announcement wording |
| 5 Missing child | Hold train, depart, or ignore | Do not hold unless SM / control orders; staff alert RPF; helplines 139 / 1098 | AIR; RCI; Konkan Railway; Taxheal | PA wording; whether trains are held; number validity |

## Open items

1. Fetch GR 4.xx / 5.xx via an official copy for the open-line rule on obstructions and a numeric "animal ahead" speed.
2. Confirm s.147 and s.154 on India Code (bare-act mirror only).
3. Read the Lok Sabha answers directly (eparlib fetch failed); the 2008 answer on the TTE-SM-doctor chain is the key source.
4. Confirm T/A 912 and the 15/10 km/h figures from a zonal circular.
5. Get the Railway Board SOP for lost children (2015 MoU follow-up).
