# Controls (default, remappable in `src/input/keymap.ts`)

| Key | Action |
|---|---|
| W / ↑ | Throttle notch up (0–8) |
| S / ↓ | Throttle notch down |
| ] (hold) | Apply train (automatic) brake |
| [ (hold) | Release train brake |
| ' (hold) | Apply loco (independent) brake |
| ; (hold) | Release loco brake |
| Backspace | Emergency brake; press again at standstill to reset |
| R | Reverser F → N → R (standstill, notch 0) |
| H / Space | Horn (hold). Short (< 0.6 s) and long (0.6–2.5 s) blasts form whistle codes, see below |
| C | Cycle camera views |
| 1 | Cab — pilot view with the driver's console (drag to look around, double-click to recentre) |
| 2 | Chase view (drag to orbit, wheel to zoom) |
| 3 | Side view (drag to slide along the train, wheel for distance) |
| 4 | Top view (wheel for height) |
| F1 or ? | Controls card |
| F3 | Performance overlay |
| Q | Cycle quality Low / Medium / High |
| P / Esc | Pause |
| Enter | Restart after a failed or finished run |

**First drive:** hold `;` to release the loco brake, press W a few times, watch the next-signal panel, brake with `]` well before red signals and the platform STOP mark.

## Horn (whistle) codes
From docs/research/01-signalling-rules.md §10 (IRFCA). The game names the code you sound; press-length thresholds are game choices.

| Code | Meaning |
|---|---|
| one long | normal departure |
| two short | calling for the Guard's signal |
| three short | Guard to apply brakes |
| two short, one long | sudden loss of brake pressure |
| four short | train cannot proceed — protect the rear |
| two long | raise pantograph |
| long, short, long | lower pantograph |
| very long (> 2.5 s) | approaching a level crossing or tunnel |
