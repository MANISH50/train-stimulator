# Immersion ideas: ranked backlog

**Purpose.** This file ranks features that help players connect with everyday Indian rail life, and gives a cited reference for station life, announcements and alarm chain pulling (ACP).

**Rules that apply** (CLAUDE.md):
- Facts carry a URL. Anything unconfirmed is marked **UNVERIFIED**.
- No Indian Railways logos, liveries or class names.
- No real people, no real incidents, no politics.
- Assets must be licensed.
- The sim stays deterministic.
- Hold the 60 FPS Medium budget.

**Where facts live.** Rule and physics facts are in `docs/research/01–04`. This file adds only the culture, station-life and crew-life facts listed under Sources.

## 1. Scoring key

**Impact (1–5):**
- 5: players notice it every run, and it defines the game as Indian rail.
- 1: a nice touch that is rarely seen.

**Effort:** person-days (pd) for one developer, including tests and content. Effort figures are rough planning numbers, not measurements.

| Size | Person-days |
|---|---|
| S | 1–3 |
| M | 4–8 |
| L | 9–20 |
| XL | 20+ |

**Sensitivity:** cultural, religious, safety or legal care needed.
- Low: no special care.
- Med: needs review by someone from the depicted region.
- High: needs a written content guideline first.

## 2. Ranked table

**How the ranking was made.** Rank = impact first, then lower effort. Items that depend on a shared system are grouped after that system.

| # | Feature | Impact | Effort (pd) | Dependencies | Sensitivity notes |
|---|---|---|---|---|---|
| 1 | **Station life and platform announcements** (PA chime, three-language arrival/departure calls, crowd murmur, vendor calls, porters, yellow line, indicator boards) | 5 | M (6–8) | `src/audio` mixer and voice clips (licensed or recorded originals); station platform props; subtitle system (#4) | **Med.** Language order varies by state (§7.2). Do not copy any real recorded announcement or chime: record original audio. No real train numbers or names. |
| 2 | **Cab life: ALP call-outs, radio with guard and SM, sign-on/sign-off, logbook** | 5 | M (6–10) | Signal events from the sim; subtitles (#4); scoring hooks | **Low–Med.** Sign-on breath test is real practice [C9]; show it neutrally, never as a joke about drinking. Call-outs should use rule wording (aspect names), not invented jargon. |
| 3 | **Ambient lineside life:** children waving, LC queues (two-wheelers, tractors, buses), farmers in fields, cattle near track, village market, cricket on a maidan, washing lines, ghats | 5 | L (10–15) | Instanced crowd/prop system; LC gates already in the sim; LOD streaming per chunk | **Med.** Avoid poverty tourism: show ordinary, dignified life. Cattle are a hazard: the game shows a horn-and-slow response, and hits are never graphic. No trespass glorification (people on tracks are shown as unsafe). |
| 4 | **Accessibility baseline:** subtitles with speaker labels, UI language choice (Hindi, English, plus one regional language per route), colour-blind assists, hold-to-toggle and assist modes | 4 (5 for affected players) | M (6–8), then ongoing | UI text tables in `content/`; licensed fonts (Noto, SIL OFL, licence row needed) | **Low.** Real signals are colour-only. Keep the lamps realistic and add an *optional* HUD letter/shape badge (R/Y/YY/G), following "do not rely on colour alone" guidance [C14]. |
| 5 | **Seasonal events:** fog season, monsoon delays and caution orders, festival rush specials with overcrowded platforms | 4 | M (5–8) | Weather already exists (PROGRESS 2026-11-01); timetable/dispatcher; station crowd density (#1) | **Med.** Fog-cap and FSD facts are in 01 and §6. Festival specials are real practice [C11]; use fictional train numbers. |
| 6 | **Alarm chain pulling (ACP) event** (scenario 17), fully played: BP drop, cab lamp/buzzer, stop, guard/ALP walk to coach, reset, delay report | 4 | M (4–6) | Brake-pipe model (02); per-coach flags in rake data; walk-time timer | **Med.** Never depict the reason as a real incident. Rotate neutral causes: medical, fallen bag, missed boarding, misuse. |
| 7 | **Regional station boards in local script** (Devanagari, Bengali, Tamil, Telugu, Gurmukhi, etc., plus Hindi and English) | 4 | S–M (3–5) | Route JSON gains `nameScripts`; Noto font atlas; text-to-texture at load (not per frame) | **Med.** Order and scripts vary by state [C5][C6]. Use fictional station names unless the route is real, and have the spelling checked by a native reader. |
| 8 | **Career mode:** trainee ALP, ALP, LP Goods, LP Passenger, LP Mail/Express; route-learning trips, exams, service record | 5 | L (15–20) | Scenario scoring; save system; #2 logbook; Did-you-know bank as exam questions | **Low.** The ladder is from secondary sources [C10], so call it "inspired by". Real timelines vary (8–20 years) and must not be stated as fact. |
| 9 | **Festival decorations, season-gated:** lights for Diwali, colour for Holi, pandal glimpses for Durga Puja, ghat crowds for Chhath, Eid, Pongal, Onam, Christmas, Guru Purab | 3 | M (5–7) | Calendar in content; prop swaps per station; crowd density (#5) | **High.** Balance faiths and regions, with no ritual close-ups and no political banners. Decorations must be generic (no real temple, mosque or pandal replicas). Needs a written content guideline and reviewer sign-off. |
| 10 | **Passenger story moments:** short, optional vignettes delivered via guard radio or platform (a student late for an exam, a wedding party, a family reunion at a festival) | 4 | L (10–14) | #2 radio, #1 station life, #4 subtitles; writer time | **High.** Fiction only. No caste, religion or regional stereotypes, and no tragedy for drama. Every script reviewed. |
| 11 | **"Did you know?" cards** on loading screens and post-run reports | 3 | S (2–3) | Card JSON with a mandatory `source` URL field; links to research docs | **Low.** Each card must cite a source, and the validator should reject cards without one. |
| 12 | **Photo mode** (free camera, time-of-day, depth of field off by default) | 3 | M (4–6) | Pause-safe camera; render settings | **Low.** Hide the HUD so shots stay brand-neutral. |
| 13 | **Journey replay** (extends the crash replay to full runs, with ghost overlay) | 3 | M (4–6) | Deterministic sim plus input log (replay already exists for crashes) | **Low.** Determinism makes this cheap: store inputs, not frames. |
| 14 | **Route atlas** (map of routes, gradients, stations, unlocked status) | 3 | M (4–6) | Route JSON; OSM-derived geometry under ODbL attribution (04 §2) | **Low–Med.** ODbL attribution is required on screen. |
| 15 | **Station food and vendor calls** (tea, regional snacks named generically) | 3 | S (2–4) | #1 audio; Did-you-know cards | **Med.** Regional food claims are UNVERIFIED until a source is added. No real brands or caterer names. |
| 16 | **Community daily challenge** (date-seeded scenario, local score, optional share code) | 3 | S–M (3–5) offline; L with an online leaderboard | Seeded RNG (already required); scenario generator | **Low**, but an online leaderboard needs a backend (no secrets in repo, privacy policy). Ship offline first. |
| 17 | **Heritage hill toy train** (narrow gauge, tight curves, steep grades, slow scenic run) | 4 | XL (25+) | New gauge/loco/rake content; curve/grade physics validation; mountain terrain | **Med.** The real lines are UNESCO-listed [C12]. Use a fictional line "inspired by" them, and do not use real line names in branding. Rack working (one line) is UNVERIFIED for modelling. |
| 18 | **Rest rules and duty-hours meter** (career layer: HQ/outstation rest before the next duty) | 2 | S (2–3) | #8 career, #2 sign-on | **Med.** The rules are disputed between unions and the Board [C8]. Present as a game rule "based on" published figures. |
| 19 | **Fictional news ticker** (menu and station TVs: weather, new routes unlocked, fictional festival specials) | 2 | S (1–2) | Content JSON | **High** risk if misused: no real people, accidents, politics or ministers. Fictional operator only, and every line reviewed. |

## 3. Top 5 for the next waves

1. **Station life and announcements (#1, plus #7 boards).** This gives the biggest "this is India" signal for one M-sized audio-and-props wave. §7 gives the facts. Original audio only.
2. **Cab life (#2).** Sign-on with breath test and SPAD pledge [C9], ALP call-outs for each aspect, guard/SM radio, and a logbook page at sign-off. This reuses existing sim events, with no new physics.
3. **Accessibility baseline (#4).** Required before #1 and #2 ship, because voice-only information excludes deaf players. Subtitles with speaker labels, HUD aspect badges, and three UI languages.
4. **Ambient lineside life (#3).** One instanced system (about 3–5 draw calls per chunk) covering waving children, LC queues, cattle and fields. Budget: zero per-frame allocations, and animation by vertex shader or shared mixers.
5. **Seasonal events plus ACP (#5 and #6).** Fog and monsoon already exist in the sim. Add a festival-rush special timetable and a fully played ACP stop. The ACP stop is a good tutorial for brake-pipe behaviour.

**Next after the Top 5:**
- career mode (#8)
- "Did you know?" cards (#11)
- photo mode and replay (#12, #13)
- festivals (#9), once the content guideline exists

## 4. Performance notes for the top items

**Lineside people and cattle:**
- `InstancedMesh` per archetype, with a shared skeleton-free vertex animation.
- Cull by chunk and cap at about 200 visible instances at Medium (a tuning value, not measured).

**Station crowds:**
- Billboard impostors beyond about 60 m; meshes only near the cab.
- Density comes from content data, not from per-frame spawning.

**Script boards:**
- Render text to a texture atlas once at route load.
- Never build canvas text per frame.

**Audio:**
- Limit concurrent voices (for example 16).
- Use one PA bus with a reverb send per station type.
- Stream announcement clips.

## 5. Sensitivity guideline (draft, to adopt before #9 and #10)

**Regional and religious balance:**
- Every region and faith shown should appear in the same respectful register.
- Festivals rotate by the calendar, and no single festival is the default.

**People and incidents:**
- No real people, officials, politicians or named railway staff.
- No recreation of any real accident, ACP case or strike.

**Language and labour:**
- No caricatured accents or broken-English jokes.
- Porters, vendors and cleaners are shown as skilled workers, never as comic relief.

**Safety messaging:**
- Unsafe acts (trespass, door-hanging, roof-riding, needless chain pulling) are shown with consequences or warnings, never as fun.

## 6. Cab and seasonal facts used above

**Sign-on:**
- Crew sign on in a lobby with a breath-analyser test.
- At sign-on they take a "No SPAD" oath and acknowledge new circulars.
- Results are recorded in the Crew Management System [C9].
- A 2015 CAG audit found biometric and breath-analyser integration was not complete everywhere [C9].

**Rest:**
- A 2018 Railway Board letter set 16 h rest at headquarters and 8 h at outstations [C8].
- A follow-up letter deferred it because of staff shortage [C8].
- The status today is **UNVERIFIED**.

**Fog:**
- GPS-based Fog Safety Devices give the LP audio-visual alerts for upcoming signals [C13].
- Officials say the device does not add visibility [C13].
- Other fog rules are in 01.

**Festival rush:**
- Reported plan of about 12,000 special trains for Diwali and Chhath, 1 Oct–30 Nov 2025 [C11].
- This figure is from news reports, not the PIB text (**UNVERIFIED** against PIB).

**Career ladder** (secondary sources [C10], **UNVERIFIED** against service rules):
- ALP, then Sr ALP, then LP Goods, then LP Passenger, then LP Mail/Express.
- Some go via LP Shunting.

## 7. Station life and announcements

### 7.1 What a busy Indian station looks and sounds like

**Porters (coolies):**
- Licensed porters wear red uniforms, with a numbered metal tag on the arm [C1].
- The Tribune describes "fiery-red uniforms" and calls the tag *copper* [C1]. It also reports that the badge (*billa*) can pass down within a family [C1].
- The brief said "brass armband". Brass is **UNVERIFIED**, so the game should model a generic metal armband with a number.
- A CCS paper describes the licensed porter as licensed by the Railways to carry passengers' luggage [C2].
- Game use: a red shirt, a numbered metal armband, and luggage carried on the head or a trolley. Use fictional badge numbers.

**Vendors and stalls:**
- Platforms have static units (tea, snacks, milk stalls), trolleys and bookstalls.
- These are allotted under the catering policy (2005, 2010 and 2017 revisions), and IRCTC runs some units [C3][C4].
- Bookstalls have had a separate policy since 2004 (**UNVERIFIED**: the detail comes from a parliamentary-answer summary).
- Game use: generic stall props, tea in clay cups or paper cups, and vendor calls recorded as original audio. No real brand or caterer names.

**Display boards:**
- Typical visible elements: train-indication boards (number, name, time, platform), coach-position boards along the platform, and clocks.
- All of these are **UNVERIFIED**: they are common knowledge, but no official spec has been sourced.
- Game use: fictional numbers, rendered in the station's scripts.

**Yellow safety line:**
- Platforms carry a yellow line that passengers should stand behind.
- The Indian evidence found so far is Kolkata Metro, which fines ₹250 for crossing it (from June 2025) [C15]. A railway-exam study page also describes it as a safe-distance line [C16].
- No Indian Railways main-line rule text has been found: **UNVERIFIED** for main-line rules.
- Game use: crowd agents stay behind the line until the train stops. A "person over the line" event triggers a horn-and-slow response.

**Crowd behaviour:**
- Typical behaviour: crowds bunch at the expected general-coach position, there is a rush to board, and passengers sit on luggage while waiting.
- This is **UNVERIFIED** observational detail. Treat it as design, not fact.
- Door-hanging and boarding a moving train should be shown only as unsafe behaviour.

### 7.2 Announcement structure and languages

**Language order:**
- In non-Hindi states, PA announcements are made in the regional language(s) as well as Hindi and English, per a 1991 Lok Sabha written answer [C5].
- Station name-boards follow regional language, Hindi, English (1956 and 1978 parliamentary records) [C6].
- Some stations have used only the local language [C6].
- The current consolidated Railway Board directive was not found (**UNVERIFIED**).
- The *order of spoken languages* on a given station is **UNVERIFIED**. Make it configurable per route in content JSON.

**Phrase pattern** (described, not copied):
- An attention chime.
- An opener, Hindi *"yatri kripya dhyan dein"* ("passengers, please pay attention") [C7], or the English "may I have your attention please".
- Then the train number, the train name, the from–to, and the status (arriving, departing or delayed), with the platform number. The train number is often read digit by digit (**UNVERIFIED**).
- Then the same message repeats in the next language.
- Many stations use automated recorded voices [C7].
- Game design:
  - Build announcements from fragments (opener, number, name, status, platform) per language.
  - Record original voice talent, or use TTS whose licence allows redistribution.
  - Add a row in `ASSET_LICENSES.md` first.
  - Subtitles for every line (#4).

### 7.3 Alarm chain pulling (ACP): what happens and how it is reset

**Mechanism:**
- The chain opens a passenger emergency valve that vents the brake pipe, breaking BP continuity, so the brakes apply [C17][C18].
- BP is normally about 5 kg/cm² (02), and the LP sees the drop on the BP gauge [C18].

**In the cab:**
- An ACP lamp and buzzer come on, and in most locos the controller auto-regresses ("notches falling to zero rapidly") [C17].
- Roof flashers activate on any BP loss not caused by the driver's own brake application [C17].

**The guard:**
- The guard may notice the pressure loss without knowing the cause, and is expected to apply the brakes [C17].

**Finding the coach:**
- A small flap or lever near the coach's emergency valve stays out after the chain is released [C17][C19].
- A hissing sound helps locate it [C18].
- A report of three horn blasts [C18] is **UNVERIFIED** as an official whistle code.

**Reset:**
- The assistant LP or the guard walks to that coach and resets the valve by hand [C20].
- Until it is reset, the cab lamp and buzzer stay on [C17].
- A divisional official put the restart delay at "15 to 20 minutes" [C20].
- BP must then recharge before release (02).

**Misuse:**
- A driver can override ACP in some circumstances, and a cab circuit breaker controls the lamp and bell [C17].
- Deliberately ignoring a genuine ACP indication "is a serious offence" [C17].

**Penalty:** Railways Act 1989, **Section 141**, "needlessly interfering with means of communication in a train" [C21]:
- Maximum: up to 1 year imprisonment, a fine up to ₹1,000, or both [C21].
- For alarm-chain misuse without reasonable cause, minimums apply unless the court records reasons:
  - first offence: fine of at least ₹500;
  - repeat offence: at least 3 months' imprisonment [C21].
- **Conflict:** The News Minute [C20] gives "up to a month" and the Free Press Journal gives 3 months as the maximum. The bare-act text [C21] wins; treat those figures as reporting errors.
- Valid reasons named in the press are medical emergency, a fall, fire, or a security incident [C18].

**ACP procedure as a game sequence** (design; each step traces to the citations above):

| Step | Who | What happens |
|---|---|---|
| 1 | Passenger | Pulls the chain. The coach valve vents BP. |
| 2 | LP | Sees the BP gauge fall, the ACP lamp and buzzer come on, and traction cut. |
| 3 | LP | Brings the train to a stand, cuts off power and keeps the brakes applied. |
| 4 | Guard | Notes the BP drop and applies the brakes. |
| 5 | LP and guard | Talk on the radio (radio use is **UNVERIFIED** as a mandated step). |
| 6 | ALP or guard | Walks to find the coach with the flap out (hissing). |
| 7 | ALP or guard | Asks why the chain was pulled. On a misuse, the case is reported to the RPF. |
| 8 | ALP or guard | Resets the valve by hand. The lamp and buzzer clear. |
| 9 | LP | Recharges BP to normal and checks brake release. |
| 10 | LP | Restarts on the signal or authority. |
| 11 | LP | Logs the detention in the logbook (#2). |

**Penalties (design, per scenario 17 in 03):**
- Restarting before the reset and BP recharge is penalised.
- Switching off the ACP breaker is a severe penalty.

## 8. Sources (section 6 and 7)

| ID | Source | Type |
|---|---|---|
| C1 | Tribune, "Baggage of life weighs down porters": https://m.tribuneindia.com/article/baggage-of-life-weighs-down-porters/698694 (direct fetch returned empty; text seen via search snippet, re-check) | News |
| C2 | CCS internship paper on railway coolies: https://old.ccs.in/internship_papers/2003/chap22.pdf | Research paper |
| C3 | IRCTC Catering Policy 2005: https://irctc.com/assets/images/catering-policy-2005.pdf | Official |
| C4 | Bar and Bench, chaiwala association petition: https://www.barandbench.com/news/chaiwala-association-sc-railways-rule | Legal news |
| C5 | Lok Sabha written answer, 1991 (PA languages): https://eparlib.nic.in/bitstream/123456789/15162/1/10_I_06081991_p40_p40_t44.pdf (best match from search, re-check) | Parliament |
| C6 | Lok Sabha records, 1956 and 1978 (name-boards): https://eparlib.nic.in/bitstream/123456789/1080882/1/01_XII_17-02-1956_p25_p25_s49.pdf ; https://eparlib.nic.in/bitstream/123456789/919581/1/06_V_01-08-1978_p7_p9_s225.pdf | Parliament |
| C7 | Scoopwhoop, the voice behind railway announcements: https://scoopwhoop.com/travel/shravan-adode-the-man-behind-railway-announcements/ | Feature |
| C8 | Railway Board rest rules (2016 and 2018 letters): https://www.airfindia.org/?p=8543 ; https://www.gconnect.in/orders-in-brief/railways-orders-in-brief/rest-rules-for-running-staff-railway-boards-clarification.html | Union / secondary |
| C9 | Lobby sign-on and CMS: https://scr.indianrailways.gov.in/cris//uploads/files/1591164768640-Lobby-DMM.pdf ; https://deccanchronicle.com/southern-states/telangana/behind-the-scenes-crew-keeps-trains-safe-1874505 ; CAG report 47/2015: https://cag.gov.in/webroot/uploads/download_audit_report/2015/Union_Performance_Railways_Crew_mgmt_Report_47_2015.pdf | Official / news / audit |
| C10 | Career ladder: https://en.wikipedia.org/wiki/Railway_crew_management_in_India ; https://www.oliveboard.in/blog/career-growth-in-indian-railways/ | Secondary |
| C11 | Festival specials 2025: https://www.newsonair.gov.in/indian-railways-to-run-over-12000-special-trains-during-festive-season | Public broadcaster |
| C12 | UNESCO, Mountain Railways of India: https://whc.unesco.org/en/list/944 | Official |
| C13 | Fog safety devices: https://www.etvbharat.com/en/bharat/railways-to-reduce-30-per-cent-delays-of-train-operations-in-fog-condition-enn25112003997 ; https://etvbharat.com/english/state/delhi/railways-fog-pass-devices-foggy-weather/na20240116155034630630734 | News |
| C14 | IGDA GA-SIG, colour-blind players: https://igda-gasig.org/?p=2386 ; Xbox Accessibility Guidelines: https://devdocs.xbox.com/build/game-principles/accessibility/xbox-accessibility-guidelines.md | Industry guideline |
| C15 | Kolkata Metro yellow-line fine: https://curlytales.com/kolkata-metro-introduces-fine-for-crossing-the-yellow-line-on-platforms/amp/ | News |
| C16 | Railway exam study page (safety protocols): https://rrb.iitk.ac.in/sathee-railway-exams/student-corner/railway-gk/indian-railway-features/safety-protocols | Study resource (weak) |
| C17 | IRFCA FAQ "Railway Operations II": https://irfca.org/faq/faq-ops2.html | Enthusiast reference |
| C18 | Curly Tales, alarm chain rules: https://curlytales.com/india/trending/indian-railways-alarm-chain-rules-when-can-you-pull-it-and-whats-the-penalty/ | News |
| C19 | Wikipedia, emergency brake (train): https://en.wikipedia.org/wiki/Emergency_brake_(train) | Encyclopedia |
| C20 | The News Minute, ACP incidents: https://www.thenewsminute.com/amp/story/karnataka/incidents-people-pulling-alarm-chains-trains-frivolous-reasons-rise-29953 | News |
| C21 | Railways Act 1989, s.141 (bare act): https://www.advocatekhoj.com/library/bareacts/railways/141.php (confirm against India Code before shipping rule text) | Statute (mirror) |

**Open items:**
- Confirm s.141 on indiacode.nic.in.
- Find official Indian Railways yellow-line and PA-language circulars.
- Re-fetch C1 for the tag material.
- Source the regional station foods before using named dishes.
