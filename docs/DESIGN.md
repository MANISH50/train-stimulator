# Game design (Phase 1 slice)

**Training Ground test section** (original, fictional; ~4.2 km):

| Chainage | Feature |
|---|---|
| 0–1200 m | Straight, level; train starts with front at 360 m, loco brake applied |
| 1200–1800 m | Left curve R 1000 m |
| 1400–2400 m | Rising 1 in 200 |
| 1500–1900 m | Temporary speed restriction 50 km/h (yellow "50" board, "T" termination board) |
| 2100 m | Distant signal D1 — YELLOW until 150 s after the start (06:02:30 on the clock), then GREEN |
| 3000 m | Home signal H1 — RED until 150 s (06:02:30), then YELLOW |
| 3000–3500 m | Falling 1 in 250 |
| 3900 m | Prashikshan Nagar platform STOP mark |

**Pass/fail (Phase 1):**
- SPAD → run fails, with a "why this rule exists" card.
- Overspeed (> limit + 2 km/h, limit checked over the whole train) → warning.
- Platform stop within ±30 m of the mark → reported with the offset.

**Next (Phase 2):** pre-departure checklist, VCD alerter (60 s + 8 s lamp + 8 s buzzer, per research 01 §8), Kavach-style warn/brake, timetable and a report card scoring punctuality, safety, smoothness (jerk ≤ 1.0–1.5 m/s³) and rule adherence.

## Accidents (game rules, approximate)
These thresholds are gameplay choices, not quoted railway figures:
- **Points:** derail above 1.6× the turnout's speed limit.
- **Curves:** derail when unbalanced lateral acceleration v²/R exceeds 2.5 m/s².
- **Buffer stop:** touching at 8 km/h or less is only a bump.
- **AI drivers:** react to a fouling train after 1.5 s, then brake at about 1.2 m/s² (emergency).
- **Crash bodies:** the crush forces (2.6–4.5 MN), buckling force (1.6 MN) and flange limit (0.6 × weight) are stylised values chosen for believable wrecks.
