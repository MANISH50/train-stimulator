import locoJson from '../content/locos/e-class.json';
import rakeJson from '../content/rakes/coach-12.json';
import routeJson from '../content/routes/test-section.json';
import { TrainAudio } from './audio/audio';
import { parseLoco, parseRake, parseRoute } from './content/schema';
import { Input } from './input/input';
import { PRESETS, QUALITY_ORDER, detectQuality } from './render/quality';
import { HornCodeDetector } from './input/hornCodes';
import { CAMERA_NAMES, GameRenderer, type CameraMode } from './render/scene';
import { FixedClock } from './sim/clock';
import { Sim, type SimSetup } from './sim/sim';
import { Hud } from './ui/hud';

const setup: SimSetup = {
  route: parseRoute(routeJson),
  loco: parseLoco(locoJson),
  rake: parseRake(rakeJson),
  startS: 360,
};

let sim = new Sim(setup);
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new GameRenderer(canvas, sim, detectQuality());
const hud = new Hud(document.getElementById('hud')!);
const input = new Input(window);
const audio = new TrainAudio();
const clock = new FixedClock();
const hornCodes = new HornCodeDetector();

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
  audio.setInCab(mode === 'cab');
  hud.toast(CAMERA_NAMES[mode], 'info');
}

function restart(): void {
  sim = new Sim(setup);
  renderer.sim = sim;
  prevS = sim.train.s;
  hud.hideOverlay();
}

function handleActions(): void {
  const ctl = sim.controls;
  const stopped = sim.train.v === 0;
  for (const a of input.takePressed()) {
    switch (a) {
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
        if (stopped && ctl.notch === 0)
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
  input.updateHandles(sim.controls, sim.consist.loco.notches, paused ? 0 : dt);

  let alpha = 1;
  if (!paused) {
    const adv = clock.advance(dt);
    alpha = adv.alpha;
    for (let i = 0; i < adv.steps; i++) {
      prevS = sim.train.s;
      sim.step();
    }
    hud.handleEvents(sim.drainEvents(), sim);
  }
  const frontS = prevS + (sim.train.s - prevS) * alpha;

  const t0 = performance.now();
  renderer.render(frontS);
  frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
  hud.update(sim, frontS, now / 1000);
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

requestAnimationFrame(frame);
showCamera(renderer.setCamera('chase'));

// Read-only hook for automated tests and debugging.
declare global {
  interface Window {
    __game?: {
      readonly sim: Sim;
      readonly fps: number;
      readonly camera: string;
      readonly stats: { calls: number; triangles: number };
    };
  }
}
window.__game = {
  get sim() {
    return sim;
  },
  get fps() {
    return fps;
  },
  get camera() {
    return renderer.cameraMode;
  },
  get stats() {
    return renderer.stats();
  },
};
