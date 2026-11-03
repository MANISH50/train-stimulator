import { Announcer, arrivalLines, delayLines } from './audio/announcer';
import { TrainAudio } from './audio/audio';
import { ZONES } from './content/catalog';
import type { SimEvent } from './sim/events';
import { dominantZone } from './sim/world/zones';
import { LEVELS, levelById, levelSetup, trainType } from './content/catalog';
import { Input } from './input/input';
import { PRESETS, QUALITY_ORDER, detectQuality } from './render/quality';
import { HornCodeDetector } from './input/hornCodes';
import { CAMERA_NAMES, CRASH_ANGLES, GameRenderer, type CameraMode } from './render/scene';
import { FixedClock, SIM_DT } from './sim/clock';
import { CrashSim } from './sim/crash/crashSim';
import { Sim } from './sim/sim';
import type { LevelDef, WeatherId } from './sim/types';
import { Hud } from './ui/hud';
import { StartMenu } from './ui/menu';

let level: LevelDef = LEVELS[0]!;
let weather: WeatherId = level.defaultWeather;
let accidents = true;
let sim = new Sim(levelSetup(level, weather, accidents));

/** Slow motion for the first moments of a crash (crash seconds) and its rate. */
const SLOWMO_S = 2.5;
const SLOWMO_RATE = 0.3;
/** A replay first shows this much of the approach (s), at half speed. */
const REPLAY_PREROLL_S = 3;
let crashShown = false;
let replay: CrashSim | null = null;
let replayPre = 0;
let replayAcc = 0;
let replayAngle = -1;
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new GameRenderer(
  canvas,
  sim,
  trainType(level.player.trainTypeId),
  detectQuality(),
);
const hud = new Hud(document.getElementById('hud')!);
hud.onNotify = () => audio.chime();
const input = new Input(window);
const audio = new TrainAudio();
const clock = new FixedClock();
const hornCodes = new HornCodeDetector();
const announcer = new Announcer();
announcer.onSubtitle = (speaker, text) => hud.subtitle(speaker, text);

const RADIO_NAMES = {
  guard: 'Guard (radio)',
  alp: 'Assistant loco pilot',
  control: 'Section control',
  cab: 'Cab',
  station: 'Station announcement',
} as const;

/** ALP call-outs of signals ahead (V toggles). */
let callouts = true;
const ASPECT_WORDS = {
  RED: 'red',
  YELLOW: 'yellow',
  DOUBLE_YELLOW: 'double yellow',
  GREEN: 'green',
} as const;

/** Voice the sim's announcements and crew radio; everything is also subtitled. */
function narrate(events: readonly SimEvent[]): void {
  for (const e of events) {
    if (e.type === 'ANNOUNCE') {
      const st = sim.setup.route.stations.find((s) => s.id === e.stationId);
      const dest = sim.setup.route.stations[sim.setup.route.stations.length - 1];
      if (!st || !dest) continue;
      const train = sim.player.label;
      announcer.say(
        e.kind === 'arriving'
          ? arrivalLines(train, dest, st, e.platform)
          : delayLines(train, e.lateMin ?? 0),
      );
    } else if (e.type === 'INCIDENT_SAY' && e.line.speaker === 'station') {
      announcer.say([
        { lang: e.line.lang ?? 'en-IN', speaker: RADIO_NAMES.station, text: e.line.text },
      ]);
    } else if (e.type === 'INCIDENT_SAY' && e.line.speaker !== 'cab') {
      announcer.radio(RADIO_NAMES[e.line.speaker], e.line.text);
    } else if (e.type === 'CALLOUT' && callouts && !announcer.busy) {
      const what = e.visible ? ASPECT_WORDS[e.aspect] : 'not in sight yet';
      announcer.radio(RADIO_NAMES.alp, `${e.label}, ${what}`);
    }
  }
}

/** Region and landmark name for the journey line. */
function placeName(frontS: number): string {
  const scene = sim.setup.route.scene;
  if (!scene) return '';
  const zone = ZONES.get(dominantZone(scene, frontS) ?? '')?.name ?? '';
  const lm = renderer.landmarkName;
  return lm ? `${zone} · ${lm}` : zone;
}

let prevS = sim.train.s;
let paused = false;
let perfOn = false;
let last = performance.now();
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;
let frameMs = 0;

window.addEventListener('keydown', () => audio.start(), { once: true });
window.addEventListener('pointerdown', () => audio.start(), { once: true });

/** The 3D console replaces the HUD instrument panel inside the cab. */
function showCamera(mode: CameraMode): void {
  hud.setInstrumentsVisible(mode !== 'cab');
  hud.setActiveCamera(mode);
  audio.setInCab(mode === 'cab');
  hud.toast(CAMERA_NAMES[mode], 'info');
}

// ---- Start menu: the game opens here; the world slowly orbits behind it. ----
const menu = new StartMenu(document.body, renderer.preset.name);
let inMenu = true;
let started = false;
renderer.setCamera('chase');
hud.setVisible(false);

function openMenu(): void {
  inMenu = true;
  menu.show(started);
  hud.setVisible(false);
}

function closeMenu(): void {
  inMenu = false;
  paused = false;
  menu.hide();
  hud.setVisible(true);
  last = performance.now();
}

menu.onStart((choice, restartRequested) => {
  audio.start();
  hud.setColourAid(choice.colourAid);
  if (choice.quality !== renderer.preset.name) renderer.applyPreset(PRESETS[choice.quality]);
  const changed =
    choice.levelId !== level.id || choice.weather !== weather || choice.accidents !== accidents;
  if (changed || restartRequested || sim.status !== 'running' || !started) {
    level = levelById(choice.levelId);
    weather = choice.weather;
    accidents = choice.accidents;
    restart();
  }
  started = true;
  closeMenu();
  showCamera(renderer.setCamera(choice.camera));
});
hud.onCameraButtons((mode) => showCamera(renderer.setCamera(mode)), openMenu);

/** Start (or restart) the current level: new sim, rebuilt world. */
function restart(): void {
  sim = new Sim(levelSetup(level, weather, accidents));
  renderer.setSim(sim, trainType(level.player.trainTypeId));
  prevS = sim.train.s;
  crashShown = false;
  replay = null;
  replayAngle = -1;
  audio.updateCrash(null);
  announcer.stop();
  hud.resetJourney();
  hud.hideOverlay();
  if (renderer.cameraMode === 'crash') showCamera(renderer.setCamera('chase'));
}

/** Replay the crash from the same setup, a new camera angle each time. */
function startReplay(): void {
  if (!sim.crashSetup) return;
  replay = new CrashSim(sim.crashSetup, sim.track, sim.net);
  replayPre = -REPLAY_PREROLL_S;
  replayAcc = 0;
  replayAngle = (replayAngle + 1) % CRASH_ANGLES.length;
  renderer.crashAngle = CRASH_ANGLES[replayAngle]!;
  renderer.setCamera('crash');
  hud.setOverlayVisible(false);
  hud.toast(`Replay — ${renderer.crashAngle} view`, 'info');
}

hud.onReplay = startReplay;
hud.onRestart = restart;

function handleActions(): void {
  const ctl = sim.controls;
  const stopped = sim.train.v === 0;
  const pressed = input.takePressed();
  if (inMenu) {
    // Driving keys are ignored on the menu; Esc returns to a journey already under way.
    if (started && pressed.includes('menu')) closeMenu();
    return;
  }
  for (const a of pressed) {
    switch (a) {
      case 'menu':
        openMenu();
        break;
      case 'notchUp':
        ctl.notch = Math.min(sim.consist.loco.notches, ctl.notch + 1);
        break;
      case 'notchDown':
        ctl.notch = Math.max(0, ctl.notch - 1);
        break;
      case 'emergency':
        if (!ctl.emergency) {
          ctl.emergency = true;
          ctl.notch = 0;
        } else if (stopped) {
          ctl.emergency = false;
        } else {
          hud.toast('Emergency can only be reset at standstill', 'warn');
        }
        break;
      case 'reverser':
        // After an accident R replays the crash; there is nothing left to drive.
        if (sim.status === 'crashed') startReplay();
        else if (stopped && ctl.notch === 0)
          ctl.reverser = ctl.reverser === 1 ? 0 : ctl.reverser === 0 ? -1 : 1;
        else hud.toast('Reverser: stop and close the throttle first', 'warn');
        break;
      case 'camera':
        showCamera(renderer.cycleCamera());
        break;
      case 'camCab':
        showCamera(renderer.setCamera('cab'));
        break;
      case 'camChase':
        showCamera(renderer.setCamera('chase'));
        break;
      case 'camSide':
        showCamera(renderer.setCamera('side'));
        break;
      case 'camTop':
        showCamera(renderer.setCamera('top'));
        break;
      case 'perf':
        perfOn = !perfOn;
        hud.showPerf(perfOn);
        break;
      case 'quality': {
        const next =
          QUALITY_ORDER[(QUALITY_ORDER.indexOf(renderer.preset.name) + 1) % QUALITY_ORDER.length]!;
        renderer.applyPreset(PRESETS[next]);
        hud.toast(`Quality: ${next}`, 'info');
        break;
      }
      case 'keys':
        hud.toggleKeyHints();
        break;
      case 'callouts':
        callouts = !callouts;
        hud.toast(`ALP signal call-outs: ${callouts ? 'on' : 'off'}`, 'info');
        break;
      case 'help':
        hud.toggleHelp();
        break;
      case 'pause':
        if (sim.status === 'running') {
          paused = !paused;
          hud.setPaused(paused);
        }
        break;
      case 'restart':
        if (sim.status !== 'running') restart();
        break;
      default:
        break;
    }
  }
}

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  handleActions();
  const frozen = paused || inMenu;
  input.updateHandles(sim.controls, sim.consist.loco.notches, frozen ? 0 : dt);
  sim.controls.horn = input.isHeld('horn');
  if (inMenu) renderer.orbit(dt);

  let alpha = 1;
  let crashDt = 0;
  if (!frozen) {
    const live = sim.crash;
    const rate = live && !replay && live.timeS < SLOWMO_S ? SLOWMO_RATE : 1;
    const adv = clock.advance(dt * rate);
    alpha = adv.alpha;
    for (let i = 0; i < adv.steps; i++) {
      prevS = sim.train.s;
      sim.step();
    }
    if (live && !replay) crashDt = adv.steps * SIM_DT;
    const events = sim.drainEvents();
    narrate(events);
    hud.handleEvents(events, sim);
    if (replay) crashDt = stepReplay(replay, dt);
  }
  if (sim.crash && !crashShown) {
    crashShown = true;
    renderer.crashAngle = 'orbit';
    showCamera(renderer.setCamera('crash'));
  }
  renderer.showCrash(replay ?? sim.crash, replay ? replayPre : 0);
  audio.updateCrash(replay && replayPre < 0 ? null : (replay ?? sim.crash));
  audio.alarm(!!sim.spad && sim.status === 'running');
  const frontS = prevS + (sim.train.s - prevS) * alpha;

  const t0 = performance.now();
  renderer.render(frontS, crashDt);
  frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
  hud.update(sim, frontS, now / 1000);
  hud.setPlace(placeName(frontS));
  audio.updateWorld(renderer.ambient, renderer.outside);
  const hornOn = input.isHeld('horn');
  audio.update(sim, hornOn);
  const horn = hornCodes.update(hornOn, now / 1000);
  if (horn?.code) hud.toast(`Horn code: ${horn.code.name} — ${horn.code.meaning}`, 'good');

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = fpsFrames / fpsTime;
    fpsFrames = 0;
    fpsTime = 0;
    hud.updatePerf({ fps, frameMs, ...renderer.stats(), quality: renderer.preset.name });
  }
  requestAnimationFrame(frame);
}

/** Advance a replay by real time `dt`; returns the crash time it advanced. */
function stepReplay(r: CrashSim, dt: number): number {
  const rate = replayPre < 0 ? 0.5 : r.timeS < SLOWMO_S ? SLOWMO_RATE : 1;
  replayAcc += dt * rate;
  let advanced = 0;
  while (replayAcc >= SIM_DT) {
    replayAcc -= SIM_DT;
    if (replayPre < 0) {
      replayPre = Math.min(0, replayPre + SIM_DT);
    } else if (!r.settled) {
      r.step(SIM_DT);
      advanced += SIM_DT;
    }
  }
  if (r.settled && replayPre === 0) hud.setOverlayVisible(true);
  return advanced;
}

requestAnimationFrame(frame);

// Read-only hook for automated tests and debugging.
declare global {
  interface Window {
    __game?: {
      readonly level: string;
      readonly sim: Sim;
      readonly fps: number;
      readonly camera: string;
      readonly replaying: boolean;
      readonly stats: { calls: number; triangles: number };
    };
  }
}
window.__game = {
  get level() {
    return level.id;
  },
  get sim() {
    return sim;
  },
  get fps() {
    return fps;
  },
  get camera() {
    return renderer.cameraMode;
  },
  get replaying() {
    return replay !== null && !replay.settled;
  },
  get stats() {
    return renderer.stats();
  },
};
