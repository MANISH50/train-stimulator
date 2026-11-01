# 01 - Indian Railways Signalling & Operating Rules (research for "Indian Train")

Compiled 2026-11-01. Everything here is paraphrased. Each bullet cites its source. **UNVERIFIED** marks anything not confirmed in a primary or reputable source.

**Source quality key**
- **[GR]**: the Indian Railways (Open Lines) General Rules 1976 text as reproduced by IRFCA. This is an older consolidated copy. Zonal G&SR 2020 editions and later amendment slips may differ in detail. For example, GR 3.07 and 3.26 were amended in Dec 2024 ([Railway Board notice](https://indianrailways.gov.in/railwayboard/uploads/directorate/traffic_tran/2025/IR%20(0pen%20Lines)%20General%20(Second%20Amendment)%20Rules%2C%2024%20-Amendment%20of%20Rules%203_26%20and%203_07%20of%20Indian%20Railways%20(Open%20Lines)%20General%20rules%2C%201976%20%20related%20Corrigendum.pdf)).
- **[IRISET]**: IRISET (the official IR signal training institute) notes "S1 Basics of Signal Engineering", Nov 2009 edition ([PDF](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), mirrored at IIT Kharagpur).
- **[IRFCA]**: Indian Railways Fan Club FAQ. This is a reputable enthusiast reference, not official.
- **[RDSO]/[IRIMEE]/[PIB]/[Zonal]**: official IR or government documents.
- **[News]**: press reports of IR instructions. Treat their figures as secondary.

---

## 1. Colour-light signal aspects (MACLS) and territory types

- **Multiple Aspect Colour Light (MACL) stop signal aspects:**
  - Red means "stop dead".
  - Yellow means proceed and be prepared to stop at the next stop signal.
  - Green means proceed.
  - Source: [IRISET S1 §4.17](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Double Yellow ("Attention", 4-aspect):** proceed, and be prepared to pass the next stop signal at restricted speed. It is used for one of two reasons. Either a turnout lies ahead, or there is less than full braking distance between the next signal (at caution) and the red signal beyond it ([IRISET S1 §4.19(c)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Lamp layout:**
  - Red is at the driver's eye level, with yellow above it and then green.
  - The second yellow sits above the green. Separating the two yellows makes "Attention" look distinct.
  - The design fails safe: if one yellow lamp fuses, the signal shows a more restrictive aspect.
  - In 3-aspect signals the top yellow is omitted.
  - Source: [IRISET S1 §13 (Automatic Block)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Clearing conditions in automatic block territory:**
  - Yellow needs one block plus overlap clear.
  - Double yellow needs two blocks plus overlap clear.
  - Green needs three blocks plus overlap clear.
  - Source: [IRISET S1 Fig 13.5](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **2-aspect territory:**
  - A stop signal shows only Stop (red) or Proceed (green).
  - A **Warner** is a permissive signal. It shows "proceed with caution and be prepared to stop at the next stop signal" when ON and Proceed when OFF.
  - A Warner may be on its own post with a "P" marker, or below a stop signal.
  - Source: [IRISET S1 §4.18](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
  - In 2-aspect territory the driver gets precise run-through information. In MACL territory, a green distant signal only tells the driver that the *next* stop signal is off ([IRISET S1 §4.19](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Aspect sequence examples (MACL, single distant):**
  - Distant Y, Home R: stop at Home.
  - Distant YY, Home Y: enter the loop line and stop at the starter if it is ON.
  - Distant G, Home Y: enter the main line and stop at the starter.
  - Distant G, Home G: run through on the main line.
  - Source: [IRISET S1 §5.4](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **With Distant and Inner Distant:**
  - The (outer) Distant shows only Attention (YY) or Proceed (G).
  - YY, Y, R means stop at Home.
  - G, G, G means run through.
  - Sources: [IRISET S1 §5.4 & note to §4.17](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), [IRFCA signal FAQ](https://irfca.org/faq/faq-signal2.html).
- **Adequate distance (overlap) beyond the first stop signal for Line Clear:**
  - At least 400 m for 2-aspect signalling.
  - At least 180 m for multiple-aspect signalling.
  - Source: [GR 8.01(2)](https://irfca.org/docs/rulebook/gr-absolute-block.html).
- **Minimum visibility (MACL):**
  - Distant signal 400 m.
  - Inner Distant 200 m.
  - All stop signals 200 m.
  - If a stop signal cannot be seen continuously for 200 m, a speed restriction is imposed.
  - Source: [IRISET S1 §10.6](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Speed caps for yellow aspects (December 2025 instruction):**

  | Train type | Double yellow | Single yellow |
  |---|---|---|
  | Vande Bharat | 110 km/h | 90 km/h |
  | Coaching / MEMU / DEMU | 100 km/h | 60 km/h |
  | Freight | 55 km/h | 40 km/h |
  | EMU | 90 km/h | 60 km/h |

  - The Railway Board reportedly issued these caps after SPAD incidents ([ETV Bharat, 17 Dec 2025](https://www.etvbharat.com/en/bharat/railways-issues-train-speed-restrictions-to-curb-spad-cases-enn25121703673)).
  - Status: [News]. I have not seen the circular itself, so treat the figures as **UNVERIFIED-primary**.

## 2. Signal types

- **Distant** is a permissive signal. It tells the driver what the stop signal ahead is showing. Where sectional speed is 120 km/h or more, two distants are provided: the "Distant" and the "Inner Distant" ([IRISET S1 §5.2](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Home** is the first stop signal (or the one after an "Outer"). It admits the train into the station. A "Routing Home" may be added between Home and the reception lines ([IRISET S1 §5.2](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Starter** controls departure. Where it is the only departure signal, it is the Last Stop Signal ([IRISET S1 §5.3](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Intermediate Starter / Routing Starter** sits between the Starter and the Advanced Starter, in rear of the points it protects ([IRISET S1 §5.3(c)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
- **Advanced Starter:**
  - It is the outermost departure signal and becomes the Last Stop Signal.
  - It is placed outside all connections.
  - Distance from the outermost points: at least 180 m (2-aspect) or 120 m (MACL).
  - Source: [IRISET S1 §5.3(b)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Route / Junction indicators:**
  - One common signal can replace one signal per line by using a route indicator.
  - A junction ("feather") indicator lights only for diverging routes.
  - A stencil or multi-lamp indicator shows a letter or number.
  - In MACL territory, speeds above 15 km/h require the direction (junction) type.
  - Source: [IRISET S1 §7.15](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Intermediate Block Signal (IBS):**
  - An Intermediate Block Post is a class 'C' station on double line, operated remotely, that splits a long block section in two ([IRISET S1 §2.29-2.30](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
  - The IB stop signal carries a circular "IB" marker, black on white ([IRISET S1 §7 markers](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), [IRFCA](https://irfca.org/faq/faq-signal2.html)).
  - The procedure for passing a failed IB signal (telephone at the signal and so on) is **UNVERIFIED** here.
- **Markers:**
  - "A" (black on white disc): automatic stop signal.
  - Lit "A": semi-automatic signal working as automatic. When unlit, treat it as a manual signal.
  - "P": permissive colour-light distant or warner on a post by itself.
  - "G" (black on yellow disc): gate stop signal.
  - "IB": intermediate block stop signal.
  - "C": colour-light calling-on signal.
  - "R": repeater.
  - Sources: [IRISET S1 markers list](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf), [railsigns.uk](https://railsigns.uk/overseas/india1.html).
- **Permissive vs stop signals:**
  - A stop signal at ON must not be passed without authority.
  - Permissive signals (warner, distant) may be passed in their most restrictive aspect.
  - Sources: [IRFCA](https://irfca.org/faq/faq-signal2.html), [IRISET S1 §4](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Calling-on signal:**
  - It is a subsidiary signal below a stop signal and has no independent existence.
  - It shows no light when ON.
  - When OFF, it tells the driver to draw ahead cautiously, ready to stop short of any obstruction, even though the main signal above is ON.
  - It is taken OFF only after the train has stopped.
  - It is not provided below the Last Stop Signal.
  - Source: [IRISET S1 §7.8-7.10](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
- **Automatic signal at ON, double line ([GR 9.02](https://irfca.org/docs/rulebook/gr-automatic-block.html)):**
  1. Stop in rear of the signal.
  2. Wait **1 minute by day, 2 minutes by night**.
  3. If the signal is still ON, sound the prescribed whistle code and exchange signals with the Guard.
  4. Proceed cautiously, as far as the line is clear, ready to stop short of any obstruction.
  5. If visibility is poor (curve, fog, rain, dust, pushing): **never exceed 8 km/h**. The driver may call the Guard to the cab.
  6. Keep caution until the next stop signal is reached. Act on that signal only after reaching it, even if it shows OFF.
  7. Meanwhile, the Guard shows a Stop hand signal to the rear.
- **Automatic signal at ON, single line ([GR 9.07](https://irfca.org/docs/rulebook/gr-automatic-block.html)):**
  - Wait the same 1 or 2 minutes.
  - If a telephone at the signal works, get permission from the Station Master or the Centralised Traffic Control (CTC) operator.
  - Otherwise use the whistle and Guard exchange, then the same cautious movement with the same 8 km/h cap in poor visibility.
- **When the line ahead is clear:** the GR text gives no number; the rule says "great caution". News reports give two different figures:
  - 15 km/h under the authority to pass a defective automatic signal (form T/A 912) ([The Wire, on the CRS Kanchanjunga probe](https://thewire.in/news/probe-blames-kanchanjunga-express-accident-on-operational-lapses-failure-of-signalling-system)).
  - 10 km/h in another report.
  - Both are **UNVERIFIED-primary**.
- **Gate signals:**
  - These are automatic signals interlocked with level crossing (LC) gates. They carry a "G" marker plus a lit "A".
  - **"A" lit:** the gate is closed and locked. Pass the signal like a normal automatic signal.
  - **"A" unlit:**
    1. Wait 1 minute by day or 2 minutes by night.
    2. Draw ahead cautiously and stop short of the LC.
    3. Make sure the gates are locked.
    4. Proceed on the gateman's hand signal.
  - **"AG" marker variant (gate plus points):** if neither "A" nor "AG" is lit, treat the signal as an absolute stop.
  - Source: [IRISET S1 §13.5.3-13.5.4](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf).
  - IRFCA describes the same pattern: wait 1-2 minutes, then creep to the gate ([IRFCA](https://irfca.org/faq/faq-signal2.html)).
- **Train held at the first stop signal** without apparent cause ([GR 4.44](https://irfca.org/docs/rulebook/gr-general.html)):
  - After 5 minutes, the driver whistles and staff go to warn the SM.
  - After 15 minutes, the Guard goes back to protect the rear.

## 3. Block working

- **Block section:** IRISET defines block section and block station (class A, B, C) under GR 1.02 ([IRISET S1 ch.2](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).
  - Simplified definition for the game: the line between the last stop signal of one block station and the first stop signal of the next.
  - That paraphrase follows the standard GR 1.02 definition, but I did not read it verbatim, so it is **UNVERIFIED-verbatim**.
- **Absolute Block System ([GR 8.01](https://irfca.org/docs/rulebook/gr-absolute-block.html)):**
  - No train leaves a block station without Line Clear from the station ahead.
  - On double line, Line Clear is given only if the line is clear up to the first stop signal plus the adequate distance.
  - On single line, there must also be no train approaching from the opposite direction.
- **Automatic Block System, double line ([GR 9.01](https://irfca.org/docs/rulebook/gr-automatic-block.html)):**
  - Continuous track circuits or axle counters.
  - The section is divided into automatic signalling sections, each governed by a stop signal.
  - A signal clears only if the line is clear to the next signal plus an adequate distance (default at least 120 m).
  - The signal returns to ON automatically once the train passes.
- **Automatic Block System, single line ([GR 9.03](https://irfca.org/docs/rulebook/gr-automatic-block.html)):**
  - Direction of traffic is established only after Line Clear.
  - Adequate distance is at least 180 m.
- **Means of Line Clear ([GR 14.01](https://irfca.org/docs/rulebook/gr-block.html)):**
  - Token or tokenless block instruments.
  - Track circuits.
  - Axle counters.
  - Electrical communication instruments.
- **Authority to proceed ([GR 14.08](https://irfca.org/docs/rulebook/gr-block.html)):**
  - Double line: the last stop signal taken OFF.
  - Single line, any one of:
    - a token from the block instrument;
    - a Line Clear Ticket;
    - a prescribed document;
    - the last stop signal OFF, in tokenless, track-circuit or axle-counter sections.
- **Token systems today:** physical token systems such as Neale's ball token are now largely historical. Most of IR uses panel route-relay or electronic interlocking ([IRFCA interlocking FAQ](https://irfca.org/faq/faq-signal4.html)).

## 4. SPAD (Signal Passed At Danger)

- **Punishment norm (1999):** Railway Board letter 99/Safety(A&R)/6/1 of 23.04.1999 ([AIRF](https://www.airfindia.org/2016/08/24/punishment-norms-in-cases-of-spad-railway-board-orders/)):
  - Removal or compulsory retirement where the SPAD is entirely the loco pilot's negligence.
  - Reduction in grade where contributory factors exist, for example undetectable loss of brake power.
- **Later revision:** after a High Power Committee review ([AIRF](https://www.airfindia.org/2016/08/24/punishment-norms-in-cases-of-spad-railway-board-orders/)):
  - Punishment is imposed after the enquiry.
  - The appellate authority may weigh contributory factors and past record.
  - In exceptional cases, running duty can be restored after re-training and a fresh psycho test.
- **2018 revision:** the norms were revised again in Jan 2018 (as reported by AIRF). The current text is **UNVERIFIED**.
- **Enforcement drives:** after the Nov 2025 Bilaspur collision, attributed to a SPAD, the Board issued circulars tightening signal and speed adherence. A July 2025 drive targeted the causes of SPAD ([The Week, Jul 2025](https://www.theweek.in/wire-updates/national/2025/07/04/des55-rail-loco-pilot-red-signal.html); [DT Next](https://www.dtnext.in/amp/story/news/tamilnadu/bilaspur-accident-pilot-jumped-signal-finds-probe-rly-board-stresses-on-norms-856233)). [News]
- **Rule basis:** GR rules treat an ON stop signal as absolute. Only the automatic-signal procedures above, or written authority or a pilot for a manual signal, allow passing it ([IRISET S1 §13.5(k)](https://cse.iitkgp.ac.in/~chitta/CRR/sigDocs/S1-basics.pdf)).

## 5. Speed restrictions

- **Sectional speed and PSRs:**
  - Sectional speeds and permanent speed restrictions (PSRs) are published in the Working Time Table.
  - The driver must observe all restrictions.
  - The driver must not make up more time than the timetable allows.
  - Source: [GR 4.08](https://irfca.org/docs/rulebook/gr-general.html).
- **Caution Order ([GR 4.09](https://irfca.org/docs/rulebook/gr-general.html)):**
  - Gives the km range, the reason and the speed.
  - Handed to the driver at the stopping station short of the site.
  - Printed on green paper (or white with a green diagonal band as a stop-gap).
- **Forms:**
  - T.409 is the caution order. T/A 409 is the "nil" caution order. T/B 409 is a reminder ([IRFCA ops FAQ](https://irfca.org/faq/faq-ops2.html)). IRFCA lists these, but I did not confirm the form numbers from an official copy, so they are **UNVERIFIED-primary**.
  - Caution orders are issued at nominated "notice stations" and cover up to the next notice station ([IRFCA](https://irfca.org/docs/caution-orders.html)).
- **Engineering signals ([GR 15.09](https://irfca.org/docs/rulebook/gr-pway.html)):**

  | Case | What is shown |
  |---|---|
  | Must stop, at most 1 day | Banner flag 600 m (BG). Three detonators 10 m apart at 1200 m (BG). Stop hand signal 30 m from the site. |
  | Must stop, more than 1 day | Stop indicator 30 m from the site. Caution indicator 1200 m (BG). Termination indicator where normal speed resumes. |
  | Slow, at most 1 day | Caution hand signals at 30 m and at least 800 m. |
  | Slow, more than 1 day | Speed indicator 30 m. Caution indicator at least 800 m. Termination indicator. |

- **Board appearance ([IRFCA signs FAQ](https://irfca.org/faq/faq-signal5.html)):**
  - Caution indicator: yellow arrow board with black markings, about 800 m before the work.
  - Speed indicator: rectangular board with white and black bands and the speed in km/h.
  - Termination: yellow circular board marked "T", "T/P" (passenger), "T/G" (goods) and similar.
  - Stop indicator: red and white banded board.
- **Fixed speed limits:**
  - Non-interlocked facing points: at most 15 km/h ([GR 4.10](https://irfca.org/docs/rulebook/gr-general.html)).
  - Turnouts and crossovers: 15 km/h unless special instructions allow more ([GR 4.10](https://irfca.org/docs/rulebook/gr-general.html)).
  - Through an interlocked station on a non-isolated line: at most 50 km/h ([GR 4.11](https://irfca.org/docs/rulebook/gr-general.html)).

## 6. Fog working

- **Detonators for visibility:** the Station Master judges visibility against a Visibility Test Object (VTO). The VTO is at least 180 m away in MACL territory, or 300-350 m for semaphore and 2-aspect. If the VTO cannot be seen, detonators are used ([IRFCA ops FAQ](https://irfca.org/faq/faq-ops2.html)).
- **Detonator placement:**
  - Placed in pairs, 10 m apart, **270 m in rear of the first stop signal**. In double-distant territory, 270 m in rear of the Inner Distant.
  - Fog signal posts mark the spot.
  - Safety radius is about 45 m.
  - Sources: [IRFCA ops FAQ](https://irfca.org/faq/faq-ops2.html); detonator use in fog per GR is also cited in parliamentary replies ([Lok Sabha](https://eparlib.nic.in/bitstream/123456789/675023/1/28590.pdf)).
- **Fog speed caps:**
  - The maximum in fog was raised from 60 to **75 km/h** for locos with fog devices (Dec 2022) ([The News Minute](https://www.thenewsminute.com/news/railways-increases-max-speed-trains-75-kmph-combat-delays-170656)). [News]
  - The loco pilot still runs at a speed that lets him stop short of an obstruction.
  - An older Northern Railway instruction ([IRFCA](https://irfca.org/faq/faq-ops2.html)):
    - Automatic block: 60 km/h after a green, 30 km/h after a double yellow.
    - Absolute block: 60 km/h maximum in dense fog.
    - Lime marking across the track at signal sighting boards.
- **Fog Safe Device (FSD) / FogPASS:**
  - GPS handheld that gives audio and visual alerts on approaching signals, LCs and PSRs.
  - It does **not** show the signal aspect.
  - Sources: [IRFCA](https://irfca.org/faq/faq-ops2.html), [Lok Sabha reply](https://eparlib.nic.in/bitstream/123456789/675023/1/28590.pdf).
- **Protecting a stopped train ([GR 6.03](https://irfca.org/docs/rulebook/gr-accidents.html)):**
  - Guard or Driver protects with a Stop hand signal.
  - Detonators on BG: one at 600 m and three (10 m apart) at 1200 m.

## 7. Level crossings

- **Gate rules ([GR 16.03](https://irfca.org/docs/rulebook/gr-lc.html)):**
  - Gates stay closed to road traffic by default unless special instructions say otherwise.
  - The gateman must be ready to show a Stop hand signal to an approaching train whenever the gate is open to road traffic.
  - The gateman carries hand signals and detonators ([GR 16.02](https://irfca.org/docs/rulebook/gr-lc.html)).
- **Unmanned crossings:** all unmanned LCs on broad-gauge passenger routes were eliminated by 31.01.2019 ([Rajya Sabha answer, Feb 2025](https://rsdebate.nic.in/bitstream/123456789/758526/1/PQ_267_07022025_U590_p355_p355.pdf)). For a modern BG setting, assume every LC is manned or interlocked.
- **Whistle boards:**
  - "W" or "W/L" on a yellow square board. In Hindi the board reads "सी/फा" (seeti/phatak, "whistle/gate").
  - Placed about 250 m before unmanned LCs and before manned LCs with poor view.
  - An "L" board marks the approach to an LC.
  - Source: [IRFCA signs FAQ](https://irfca.org/faq/faq-signal5.html).
  - Other sources quote 600 m. That distance is **UNVERIFIED**.
- **Whistle code:** sound a very long whistle approaching an LC or tunnel ([IRFCA whistle codes](https://irfca.org/faq/faq-signal5.html)).
- **Gate signals:** see section 2 ("G" marker procedure).

## 8. Vigilance Control Device (VCD)

- **Monitored actions:** the VCD watches crew activity such as throttle notch change, brake operation, horn, sanding, reverser and the VCD reset button.
- **Cycle ([IRIMEE notes](https://rskr.irimee.in/sites/default/files/REMMLOT%20AND%20VIGILANCE%20CONTROL%20DEVICE.pdf)):**
  1. 60 s monitoring.
  2. If there is no activity, the yellow VCD lamp **flashes for 8 s**.
  3. If there is still no activity, the **buzzer sounds for 8 s**.
  4. Then the **penalty brake** applies. The full cycle is 76 s.
- **Older description ([PIB 2003](https://archive.pib.gov.in/release02/lyr2003/rsep2003/01092003/r010920031.html)):** an audio-visual alert after 20 s without activity, then automatic brakes within 10 s. The timings differ by loco class and generation.
- **Electric tap-changer locos:** the VCD penalty triggers emergency braking through the IP valve plus traction regression (RDSO modification sheet, [RDSO MS-0382](https://rdso.indianrailways.gov.in/uploads/files/MS-0382_VCD%20signed%20with%20annex.pdf)).
- **Reset after a penalty** (for example, a wait time before release): **UNVERIFIED**.

## 9. Kavach (formerly TCAS)

- **What it is:** an RDSO-developed automatic train protection system, certified SIL-4.
- **Components:**
  - RFID tags on the track.
  - Stationary (station) Kavach units.
  - Onboard loco unit with a Brake Interface Unit.
  - UHF radio; version 4.0 adds LTE-R.
- **Functions:**
  - Overspeed and movement-authority supervision.
  - SPAD prevention.
  - Head-on and rear-end collision protection.
  - Roll-back detection.
  - Automatic horn at LCs.
  - SOS.
  - Source for all of the above: [Wikipedia (citing RDSO/PIB)](https://en.wikipedia.org/wiki/Kavach_(train_protection_system)).
- **DMI / LP-OCIP (what the loco pilot sees):**
  - Colour touchscreen showing upcoming signal aspects, permitted and target speed, and distance to go.
  - Audio-visual warnings.
  - SOS and acknowledgement buttons.
  - Event recorder.
  - Sources: [Wikipedia](https://en.wikipedia.org/wiki/Kavach_(train_protection_system)), [PIB Kavach doc](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2022/mar/doc202231424701.pdf).
- **Configurable defaults (Onboard Kavach parameters, Amdt-3, effective 16.07.2024; [RDSO/SPN/196/2020 Annexure A2](https://rdso.indianrailways.gov.in/uploads/files/Annexure-A2-Specification%20of%20%20Kavach%20(The%20Indian%20Railway%20ATP)-%20Onboard%20KAVACH%20Configurable%20Parameters%20Amdt-3%2016_07_2024%20Final%20after%20signed.pdf)):**

  | Parameter | Default | Range |
  |---|---|---|
  | DMI **warning** | permitted speed **+2 km/h** | 0-10 |
  | **Normal Service Brake (NSB)** | **+5 km/h** | 5-10 |
  | **Full Service Brake (FSB)** margin | 3 km/h | |
  | **Emergency Brake (EB)** margin | 2 km/h | |
  | Loco-pilot reaction time margin | 8 s | |
  | SOS speed limit | 30 km/h | |
  | SoS timeout | 180 s | |
  | Override mode timeout | 120 s | |
  | Roll-away / roll-back trigger | 10 m | |

  - It is **UNVERIFIED** whether the FSB and EB margins stack on top of the NSB margin (giving +8 and +10) or are measured from permitted speed. The spec table layout is ambiguous.
- **Operating modes:**
  - Full Supervision, Limited Supervision, On Sight, Staff Responsible, Shunting.
  - Stand By, Trip, Post Trip, System Failure.
  - Non Leading, Reverse, Override, Isolation.
  - Source: [Wikipedia](https://en.wikipedia.org/wiki/Kavach_(train_protection_system)).
- **Trial demonstration:** Kavach automatically cut speed from 60 to 30 km/h when a loco entered a loop line ([PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2022/mar/doc202231424701.pdf)).
- **LC auto-horn trigger distance:** default **UNVERIFIED**, because the PDF table is garbled.

## 10. Hand signals and crew communication

- **Basic hand signals ([IRFCA signs/hand signals FAQ](https://irfca.org/faq/faq-signal5.html)):**

  | Meaning | Day | Night / no flag |
  |---|---|---|
  | **Stop** | Red flag | Both arms raised, or red lamp, or a white lamp waved violently if no red lamp |
  | **Proceed** | Green flag held steady | One arm extended sideways, or steady green lamp |
  | **Proceed with caution** | Green flag moved up and down | Green lamp moved up and down |

  - A slower caution movement means reduce speed further.
- **All-ready signal:** green flag or lamp waved 3 times horizontally, then 2 times vertically ([IRFCA](https://irfca.org/faq/faq-signal5.html)).
- **Starting rules:**
  - The driver starts only with authority to proceed, correct fixed signals, a clear line and the Guard's start signal ([GR 4.35](https://irfca.org/docs/rulebook/gr-general.html)).
  - The Guard gives the start signal only with the SM's permission ([GR 4.35](https://irfca.org/docs/rulebook/gr-general.html)).
  - Driver and Guard exchange signals as prescribed and acknowledge station "all right" signals when running through ([GR 4.42](https://irfca.org/docs/rulebook/gr-general.html)).
- **Whistle codes ([IRFCA](https://irfca.org/faq/faq-signal5.html); notation: o = short, -- = long):**
  - One long: normal departure.
  - Two short: call for the Guard's signal.
  - Three short: Guard to apply brakes.
  - Two short and one long: sudden loss of brake pressure.
  - Four short: train cannot proceed; protect the rear.
  - Longer blast: passing an automatic stop signal at ON.
  - Very long: approaching an LC or tunnel, or crossing a stop signal at ON after waiting.
  - Two long: raise pantograph.
  - Long, short, long: lower pantograph.
  - Repeated short blasts: danger.
- **Walkie-talkies:**
  - Railway Board policy is digital 5 W VHF sets for LP, ALP, SM and Train Manager (Guard), for LP-Guard talk and talk with other trains' crews ([ECR Telecom Circular 08/2024](https://ecr.indianrailways.gov.in/cris//uploads/files/1729080137260-Use%20of%20Digital%20VHF_Telecom%20Circular%20No%2008_2024.pdf)).
  - Station Masters should not chatter to crews during train movement, only for emergencies or on request ([DT Next, Southern Railway](https://www.dtnext.in/amp/story/news/tamilnadu/dont-distract-crew-on-walkie-talkie-use-only-during-emergency-sr-745587)).

## 11. Pre-departure cab and brake checks

- **Driver's general duty ([GR 4.32](https://irfca.org/docs/rulebook/gr-general.html)):** before the journey and after shunting, the driver ensures:
  - the engine is in working order;
  - the coupling to the train is secure;
  - headlight and marker lights work.
  - Driver and Guard also read the notices before starting ([GR 4.30](https://irfca.org/docs/rulebook/gr-general.html)).
- **Brake continuity test ([IRIMEE "Testing of Loco & Rake"](https://rskr.irimee.in/sites/default/files/TESTING%20OF%20LOCO%20AND%20RAKE_0.pdf)):**
  - **When required:**
    - a loco is attached at the front or rear;
    - vehicles are attached or detached anywhere except the extreme rear;
    - a brake defect affecting continuity has been rectified.
  - **Procedure:**
    1. Brake valve to RUNNING. Brake pipe (BP) reads about **5.0 kg/cm²**.
    2. Reduce BP to **4.0 kg/cm²** and isolate the BP cock.
    3. The Guard opens the emergency valve or rear angle cock.
    4. The loco BP gauge must fall to **0**.
    5. Restore pressure: 5 kg/cm² at the loco and the maximum at the last vehicle.
- **Leakage test** (same source):
  - Reduce 5 to 4 kg/cm² and isolate.
  - Wagons: drop of at most 1.25 kg/cm² in 5 minutes.
  - Coaches: drop of at most 0.6 kg/cm² in 3 minutes.
- **Loco charging capability** (same source):
  - Fit a 7.5 mm leak-hole coupling and open it.
  - BP must not fall below 4.0 kg/cm² in 60 s on 28LAV-1 brake systems, or below 4.8 kg/cm² on IRAB-1.
- **Feed pipe (FP) and pressures at the brake van:**
  - The feed pipe is normally charged to **6.0 kg/cm²** alongside BP 5.0. Guard's-van readings are about 4.8 or 4.7 (BP) and 5.8 (FP) kg/cm², depending on rake length.
  - Source: SCR Fly Leaf 01/2025 as summarised by search ([SCR](https://scr.indianrailways.gov.in/cris//uploads/files/1740030704298-Fly%20Leaf%20No.%2001%20of%202025.pdf)). The site blocked direct fetch, so this is **UNVERIFIED-read**.
- **Electric light-loco brake feel test ([IRFCA, unofficial](https://irfca.org/docs/waX-brake-test.html)):**
  - Apply the loco brake. Brake cylinder (BC) pressure should be about 3-3.5 kg/cm².
  - Take notches until traction motor current reaches about 650 A. The loco must not move.
- **Main reservoir (MR), 3-phase electric locos:** compressor governor cuts out at about 10 kg/cm² and cuts in at about 8 kg/cm². These are Patiala Locomotive Works (PLW) dispatch test-sheet values ([PLW](https://plw.indianrailways.gov.in/uploads/39485.pdf)), seen via search summary, so they are **UNVERIFIED-read**.
- **Brake power certificate (BPC):**
  - Air-braked goods trains originate with at least **85%** brake power.
  - Coaching trains need 100% from the originating station.
  - Source: IRIMEE MCT-02 ([PDF](https://rskr.irimee.in/sites/default/files/MCT%2002.pdf)), via search summary.
- **Diesel-specific checks** (fuel, lube oil, coolant, engine start): no primary source found, so **UNVERIFIED**.

---

## Game implementation notes

| Rule | Game mechanic |
|---|---|
| MACL aspects R / Y / YY / G | Signal state machine driven by block occupancy. Y needs 1 block plus overlap clear, YY needs 2, G needs 3. Lamp stack, bottom to top: R, Y, G, Y2. |
| Yellow / double-yellow speed caps (Dec 2025) | Optional "strict mode" target speeds per train class (freight 40 / 55). Scoring penalty if exceeded after passing the aspect. |
| Distant / Inner Distant / Home / Starter / Advanced Starter / IB | Station layout templates. Signal objects carry `type` and `marker` (A, P, G, IB, C). The HUD shows the marker plate. |
| Route / junction indicator | Feather lights on the Home signal when the route diverges. A diverging route enforces the turnout speed (15 km/h unless the route allows more). |
| Calling-on signal | Small subsidiary light below a stop signal. Clears only after the train stops. Enters an "on-sight" mode with a low speed cap. |
| Automatic signal at ON ("A" marker) | Player must stop, and a timer runs (60 s by day, 120 s by night, game clock). Then the player sounds a long whistle and proceeds in on-sight mode. Cap 8 km/h in fog or curves. A soft cap (for example 15 km/h, configurable, UNVERIFIED) when visibility is clear. On-sight mode lasts until the next stop signal is reached. |
| Gate signal ("G" plus lit "A") | Lit "A": same as an automatic signal. Unlit "A": wait, then creep to the LC, stop, and wait for the gateman's green flag. |
| Manual stop signal at ON | Cannot pass without a "paper authority" event from the SM (radio dialogue). Passing it is a SPAD. |
| SPAD | Instant fail state or major penalty, with an "inquiry" screen. With Kavach, the train brakes before the signal. |
| Absolute block / Line Clear | Last stop signal stays red until AI dispatcher logic grants Line Clear. Single-line routes need a token or tokenless clearance before departure. |
| Caution orders (T.409) | Pre-run briefing card listing km, speed and reason. In-world caution / speed / "T/P" / "T/G" boards. Speed compliance scoring between the speed board and the termination board (whole train length). |
| PSR / sectional speed | Route speed profile from a "Working Time Table" asset. |
| Fog | Visibility slider. Detonator "bang" audio 270 m before the first stop signal. Fog Safe Device HUD showing distance to the next signal or LC, but not its aspect. Fog speed cap 75 km/h (configurable). |
| Level crossings | Whistle-board trigger. The player must sound the horn within N m (score). Gate animation. Gateman waves a red or green flag. |
| VCD | 60 s inactivity timer, reset by any control input. Then 8 s flashing yellow lamp, then 8 s buzzer, then penalty emergency brake. A "VCD reset" button on the cab. |
| Kavach | DMI overlay: target speed, permitted speed, distance to go, next signal aspect. Overspeed +2 shows a warning chime. +5 applies a service brake. Higher margins apply a full service or emergency brake. Brakes automatically before a red signal. SOS button. Kavach is a toggle per route, since not all routes are fitted. |
| Hand signals / whistle codes | Station staff NPC flag animations. Whistle-code input (short and long horn presses) for the Guard exchange. Radio (walkie-talkie) messages from the Guard and SM. |
| Departure procedure | Checklist UI, in order: read notices, then SM permission and Guard green flag, then starter OFF, then long whistle, then start smoothly. |
| Pre-departure checks | Mini-game. Charge MR (8 to 10 kg/cm²), BP to 5.0 and FP to 6.0. Continuity test: drop BP to 4.0, the Guard vents, the gauge must read 0, then recharge. Brake feel test. A failed check blocks departure. |
| Train held at first stop signal | After 5 min, a whistle prompt. After 15 min, an event in which the Guard goes to protect the rear. |

## Uncertain / needs verification

1. Exact current wording of GR 3.07 (aspects) after the Dec 2024 amendment (G.S.R. 778(E)). I did not obtain the full text.
2. Speed after passing an automatic signal at ON with clear visibility. The GR says only "great caution". 15 km/h and 10 km/h are both reported by news; the 8 km/h cap applies only when the view is obscured.
3. Dec 2025 yellow and double-yellow speed caps per train class. News-sourced only; the circular has not been seen.
4. SPAD punishment norms as revised in 2018 and later. The current text has not been seen.
5. IB signal failure procedure (telephone and permission details).
6. T.409 / T/A 409 / T/B 409 form numbering and the exact contents of an official copy.
7. Whistle board distance: IRFCA says about 250 m; 600 m is also quoted elsewhere.
8. Fog speed cap. 75 km/h (news, 2022) versus zonal instructions (older NR: 60 km/h, and 30 km/h after double yellow). The current Railway Board fog circular has not been seen.
9. VCD reset and penalty-release behaviour; differences between loco classes (WAG-9 versus WAP-7 versus diesel).
10. Kavach: whether the FSB and EB margins are cumulative, and the default LC auto-horn distance.
11. FP and brake-van pressures (SCR fly leaf) and MR cut-in/out (PLW sheet). Read via search summary only.
12. Diesel loco pre-departure checklist items (no primary source found).
13. The block section definition is paraphrased (GR 1.02 not read verbatim).
14. BPC validity periods (quiz sites quote 24 h for passenger and 5,500 km for freight). Unverified.
