import { ACTION_LABELS, DEFAULT_KEYMAP, keyLabel, type Action } from '../input/keymap';
import type { CameraMode } from '../render/scene';
import type { SimEvent } from '../sim/events';
import { BP_CHARGED } from '../sim/physics/brakes';
import type { Sim } from '../sim/sim';
import { ASPECT_MEANING, aspectAt, nextSignal } from '../sim/signalling/signal';
import './hud.css';

/** Sim clock starts at a fictional 06:00 departure. */
const CLOCK_START_S = 6 * 3600;

const WHY: Record<string, string> = {
  SPAD: 'Why this rule exists: a red signal protects the block section ahead — another train, a set of points or an obstruction may be there. Passing it at danger risks a collision, so it is treated as one of the most serious driving errors.',
  OVERSPEED:
    'Why this rule exists: speed limits reflect curves, track condition and work sites. A temporary restriction applies until the last vehicle has passed the termination board.',
};

export interface PerfSample {
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
  quality: string;
}

/** DOM overlay: driving instruments, signal panel, messages and the controls card. */
export class Hud {
  private readonly el: Record<string, HTMLElement> = {};
  private lastUpdate = -1;
  private toastTimer = 0;

  constructor(private readonly root: HTMLElement) {
    root.innerHTML = `
      <section class="panel instruments" aria-label="Instruments">
        <div class="speed"><span data-k="speed">0</span><small>km/h</small></div>
        <div class="limit" title="Current speed limit"><span data-k="limit">110</span></div>
        <div class="row"><label>Notch</label><div class="bar"><i data-k="notchBar"></i></div><b data-k="notch">0</b></div>
        <div class="row"><label>BP</label><div class="bar bp"><i data-k="bpBar"></i></div><b data-k="bp">5.0</b></div>
        <div class="row"><label>BC</label><div class="bar bc"><i data-k="bcBar"></i></div><b data-k="bc">0.0</b></div>
        <div class="row"><label>Train brake</label><b data-k="auto">0%</b></div>
        <div class="row"><label>Loco brake</label><b data-k="indep">100%</b></div>
        <div class="row"><label>Reverser</label><b data-k="rev">F</b></div>
        <div class="flags"><span data-k="slip" class="flag">WHEEL SLIP</span><span data-k="emerg" class="flag">EMERGENCY</span></div>
      </section>
      <section class="panel signal" aria-label="Next signal">
        <div class="lampbox"><i data-k="lamp1"></i><i data-k="lamp2"></i></div>
        <div>
          <div class="sigName" data-k="sigName">—</div>
          <div class="sigMeaning" data-k="sigMeaning"></div>
          <div class="sigDist" data-k="sigDist"></div>
        </div>
      </section>
      <section class="panel top" aria-label="Journey">
        <span data-k="clock">06:00:00</span>
        <span data-k="next"></span>
        <span data-k="hint" class="hint"></span>
      </section>
      <nav class="panel camBar" aria-label="Camera view">
        <button data-cam="cab" title="Cab — pilot view with console">Cab<kbd>1</kbd></button>
        <button data-cam="chase" title="Chase view">Chase<kbd>2</kbd></button>
        <button data-cam="side" title="Side view">Side<kbd>3</kbd></button>
        <button data-cam="top" title="Top view">Top<kbd>4</kbd></button>
        <button class="menuBtn" data-k="menuBtn" title="Menu (Esc)">☰ Menu</button>
      </nav>
      <div class="panel keysBar" data-k="keysBar" aria-label="Key hints">
        <span><kbd>W</kbd>/<kbd>S</kbd> throttle</span>
        <span><kbd>]</kbd> brake · <kbd>[</kbd> release</span>
        <span><kbd>;</kbd> release loco brake · <kbd>'</kbd> apply</span>
        <span><kbd>Backspace</kbd> emergency</span>
        <span><kbd>R</kbd> reverser</span>
        <span><kbd>H</kbd> horn</span>
        <span><kbd>1</kbd>–<kbd>4</kbd> camera</span>
        <span><kbd>F1</kbd> all keys</span>
        <span><kbd>Esc</kbd> menu</span>
        <span><kbd>K</kbd> hide hints</span>
      </div>
      <div class="toast" data-k="toast" role="status"></div>
      <div class="perf" data-k="perf" hidden></div>
      <div class="overlay" data-k="overlay" hidden></div>
      <div class="overlay help" data-k="help" hidden></div>
    `;
    root.querySelectorAll<HTMLElement>('[data-k]').forEach((n) => (this.el[n.dataset['k']!] = n));
    this.el['help']!.innerHTML = this.helpHtml();
  }

  update(sim: Sim, frontS: number, realTimeS: number): void {
    // ~15 Hz DOM updates keep layout cost low.
    if (realTimeS - this.lastUpdate < 1 / 15) return;
    this.lastUpdate = realTimeS;
    const t = sim.train;
    const c = sim.controls;
    const kmh = Math.abs(t.v) * 3.6;
    const limit = sim.currentLimitKmh();
    this.set('speed', kmh.toFixed(0));
    this.el['speed']!.classList.toggle('over', kmh > limit + 2);
    this.set('limit', String(limit));
    const notches = sim.consist.loco.notches;
    this.set('notch', `${c.notch}/${notches}`);
    this.el['notchBar']!.style.width = `${(c.notch / notches) * 100}%`;
    this.set('bp', t.brakes.bp.toFixed(1));
    this.el['bpBar']!.style.width = `${(t.brakes.bp / BP_CHARGED) * 100}%`;
    this.set('bc', t.brakes.bc.toFixed(1));
    this.el['bcBar']!.style.width = `${(t.brakes.bc / sim.consist.rake.bcMax) * 100}%`;
    this.set('auto', `${Math.round(c.autoBrake * 100)}%`);
    this.set('indep', `${Math.round(c.indepBrake * 100)}%`);
    this.set('rev', c.reverser === 1 ? 'F' : c.reverser === -1 ? 'R' : 'N');
    this.el['slip']!.classList.toggle('on', t.wheelSlip);
    this.el['emerg']!.classList.toggle('on', c.emergency);

    const sig = nextSignal(sim.setup.route.signals, frontS);
    if (sig) {
      const aspect = aspectAt(sig, sim.timeS);
      const dist = sig.chainageM - frontS;
      this.set('sigName', sig.label);
      this.set('sigMeaning', `${aspect.replace('_', ' ')} — ${ASPECT_MEANING[aspect]}`);
      this.set('sigDist', dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist.toFixed(0)} m`);
      const [l1, l2] = [this.el['lamp1']!, this.el['lamp2']!];
      l1.className = `lamp ${aspect === 'RED' ? 'r' : aspect === 'GREEN' ? 'g' : 'y'}`;
      l2.className = `lamp ${aspect === 'DOUBLE_YELLOW' ? 'y' : 'off'}`;
    } else {
      this.set('sigName', 'No signal ahead');
      this.set('sigMeaning', '');
      this.set('sigDist', '');
      this.el['lamp1']!.className = 'lamp off';
      this.el['lamp2']!.className = 'lamp off';
    }

    this.set('clock', formatClock(CLOCK_START_S + sim.timeS));
    const st = sim.setup.route.stations.find((s) => s.stopMarkM > frontS - 30);
    this.set(
      'next',
      st ? `Next stop: ${st.name} in ${Math.max(0, st.stopMarkM - frontS).toFixed(0)} m` : '',
    );
    this.set('hint', this.hint(sim));
  }

  handleEvents(events: SimEvent[], sim: Sim): void {
    for (const e of events) {
      switch (e.type) {
        case 'SPAD':
          this.showOverlay('Signal passed at danger', sim.failReason, WHY['SPAD']!);
          break;
        case 'OVERSPEED':
          this.toast(
            `Overspeed: ${e.speedKmh.toFixed(0)} km/h in a ${e.limitKmh} km/h limit`,
            'warn',
          );
          break;
        case 'SIGNAL_PASSED':
          this.toast(`Passed ${e.signalId} at ${e.aspect.replace('_', ' ')}`, 'info');
          break;
        case 'STATION_STOP': {
          const off = e.offsetM;
          const where =
            Math.abs(off) < 2
              ? 'right on the mark'
              : `${Math.abs(off).toFixed(1)} m ${off > 0 ? 'past' : 'short of'} the mark`;
          this.toast(`Stopped at platform — ${where}`, Math.abs(off) < 5 ? 'good' : 'info');
          break;
        }
        case 'END_OF_TRACK':
          this.showOverlay(
            'End of test section',
            'You ran out of track. Stop at the platform mark next time.',
            '',
          );
          break;
        default:
          break;
      }
    }
  }

  toast(text: string, kind: 'info' | 'warn' | 'good'): void {
    const t = this.el['toast']!;
    t.textContent = text;
    t.className = `toast show ${kind}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (t.className = 'toast'), 3500);
  }

  showPerf(on: boolean): void {
    this.el['perf']!.hidden = !on;
  }

  updatePerf(p: PerfSample): void {
    if (this.el['perf']!.hidden) return;
    this.el['perf']!.textContent =
      `${p.fps.toFixed(0)} FPS · ${p.frameMs.toFixed(1)} ms · ${p.calls} draws · ${(p.triangles / 1000).toFixed(0)}k tris · ${p.quality}`;
  }

  /** Wire the on-screen camera buttons and the Menu button. */
  onCameraButtons(onCamera: (mode: CameraMode) => void, onMenu: () => void): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-cam]').forEach((b) =>
      b.addEventListener('click', (e) => {
        (e.currentTarget as HTMLButtonElement).blur(); // keep keyboard driving focused on the game
        onCamera(b.dataset['cam'] as CameraMode);
      }),
    );
    this.el['menuBtn']!.addEventListener('click', onMenu);
  }

  setActiveCamera(mode: CameraMode): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-cam]').forEach((b) => {
      const on = b.dataset['cam'] === mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  /** Hide the whole driving HUD (used behind the start menu). */
  setVisible(on: boolean): void {
    this.root.hidden = !on;
  }

  setInstrumentsVisible(on: boolean): void {
    this.root.querySelector<HTMLElement>('.instruments')!.hidden = !on;
  }

  toggleKeyHints(): void {
    this.el['keysBar']!.hidden = !this.el['keysBar']!.hidden;
  }

  toggleHelp(): void {
    this.el['help']!.hidden = !this.el['help']!.hidden;
  }

  setPaused(paused: boolean): void {
    if (paused) this.showOverlay('Paused', 'Press P to continue, or Esc for the menu.', '');
    else this.el['overlay']!.hidden = true;
  }

  hideOverlay(): void {
    this.el['overlay']!.hidden = true;
  }

  private showOverlay(title: string, body: string, why: string): void {
    const o = this.el['overlay']!;
    o.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    const h = document.createElement('h2');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = body;
    card.append(h, p);
    if (why) {
      const w = document.createElement('p');
      w.className = 'why';
      w.textContent = why;
      card.append(w);
    }
    const k = document.createElement('p');
    k.className = 'keys';
    k.textContent = 'Press Enter to restart';
    card.append(k);
    o.append(card);
    o.hidden = false;
  }

  private hint(sim: Sim): string {
    const c = sim.controls;
    if (sim.status !== 'running') return '';
    if (sim.train.v !== 0) return '';
    if (c.emergency) return 'Emergency applied — press Backspace to reset';
    if (c.reverser === 0) return 'Set the reverser to F (R)';
    if (c.indepBrake > 0.05) return 'Release the loco brake (hold ;)';
    if (c.autoBrake > 0.05) return 'Release the train brake (hold [)';
    if (c.notch === 0) return 'Open the throttle (W)';
    return '';
  }

  private helpHtml(): string {
    const rows = (Object.keys(ACTION_LABELS) as Action[])
      .map(
        (a) =>
          `<tr><td>${DEFAULT_KEYMAP[a].map(keyLabel).join(' / ')}</td><td>${ACTION_LABELS[a]}</td></tr>`,
      )
      .join('');
    return `<div class="card"><h2>Controls</h2><table>${rows}</table>
      <p class="why">Training Ground: wait at red signals, obey the 50 km/h temporary restriction until the whole train is past the T board, and stop at the platform STOP mark.</p>
      <p class="keys">F1 or ? to close</p></div>`;
  }

  private set(key: string, text: string): void {
    const n = this.el[key]!;
    if (n.textContent !== text) n.textContent = text;
  }
}

function formatClock(totalS: number): string {
  const s = Math.floor(totalS) % 86400;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
