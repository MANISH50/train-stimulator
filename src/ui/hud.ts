import { ACTION_LABELS, DEFAULT_KEYMAP, keyLabel, type Action } from '../input/keymap';
import type { CameraMode } from '../render/scene';
import type { SimEvent } from '../sim/events';
import { BP_CHARGED } from '../sim/physics/brakes';
import type { Sim } from '../sim/sim';
import { FACTS, ZONES } from '../content/catalog';
import { ASPECT_MEANING } from '../sim/signalling/signal';
import type { Debrief } from '../sim/station/incidents';
import './hud.css';

/** Sim clock starts at a fictional 06:00 departure. */
const CLOCK_START_S = 6 * 3600;

const WHY: Record<string, string> = {
  SPAD: 'Why this rule exists: a red signal protects the block section ahead — another train, a set of points or an obstruction may be there. Passing it at danger risks a collision, so it is treated as one of the most serious driving errors.',
  OVERSPEED:
    'Why this rule exists: speed limits reflect curves, track condition and work sites. A temporary restriction applies until the last vehicle has passed the termination board.',
  DERAILMENT:
    'Why this rule exists: the limit on points and curves keeps the sideways force on the wheels low enough for the flanges to hold the rails. Far above it, wheels climb the rail and the train leaves the track.',
  BUFFER:
    'Why this rule exists: at a dead-end terminus the line ends at buffer stops, which can only absorb a very slow touch. Approach terminal platforms slowly and stop well short of the buffers.',
};

const CRASH_TITLES: Record<string, string> = {
  'rear-end': 'Rear-end collision',
  'head-on': 'Head-on collision',
  side: 'Side collision at the points',
  derailment: 'Derailment',
  buffer: 'Buffer-stop collision',
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
  private bannerTimer = 0;
  /** Called for important notifications (e.g. a chime from the audio system). */
  onNotify: () => void = () => {};
  /** Journey log: regions and landmarks passed, with times. */
  readonly journey: string[] = [];
  private readonly factsShown = new Set<string>();
  private subtitleTimer = 0;
  /** Inquiry card buttons. */
  onReplay: () => void = () => {};
  onRestart: () => void = () => {};

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
          <div class="sigRoute" data-k="sigRoute"></div>
        </div>
      </section>
      <section class="panel top" aria-label="Journey">
        <span data-k="clock">06:00:00</span>
        <span data-k="next"></span>
        <span data-k="place" class="place"></span>
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
      <div class="banner" data-k="banner" role="alert"><b data-k="bannerTitle"></b><span data-k="bannerText"></span></div>
      <div class="flash" data-k="flash"></div>
      <div class="subtitle" data-k="subtitle" aria-live="polite"><b data-k="subSpeaker"></b><span data-k="subText"></span></div>
      <div class="perf" data-k="perf" hidden></div>
      <div class="overlay" data-k="overlay" hidden></div>
      <div class="overlay help" data-k="help" hidden></div>
    `;
    root.querySelectorAll<HTMLElement>('[data-k]').forEach((n) => (this.el[n.dataset['k']!] = n));
    this.el['help']!.innerHTML = this.helpHtml();
  }

  update(sim: Sim, _frontS: number, realTimeS: number): void {
    // ~15 Hz DOM updates keep layout cost low.
    if (realTimeS - this.lastUpdate < 1 / 15) return;
    this.lastUpdate = realTimeS;
    this.root.classList.toggle('spadAlarm', !!sim.spad && sim.status === 'running');
    this.root.classList.toggle('crashed', sim.status === 'crashed');
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

    const view = sim.nextSignalView();
    const [l1, l2] = [this.el['lamp1']!, this.el['lamp2']!];
    if (view) {
      const { def, aspect, distM, visible } = view;
      this.set('sigName', def.label);
      const pf = sim.routeIndicator(def);
      this.set('sigRoute', pf !== null ? `Route indicator: platform ${pf}` : '');
      this.set(
        'sigDist',
        distM > 1000 ? `${(distM / 1000).toFixed(2)} km` : `${distM.toFixed(0)} m`,
      );
      if (visible) {
        this.set('sigMeaning', `${aspect.replace('_', ' ')} — ${ASPECT_MEANING[aspect]}`);
        l1.className = `lamp ${aspect === 'RED' ? 'r' : aspect === 'GREEN' ? 'g' : 'y'}`;
        l2.className = `lamp ${aspect === 'DOUBLE_YELLOW' ? 'y' : 'off'}`;
        // Letters for the colour-blind aid (shown by CSS when the aid is on).
        l1.dataset['letter'] = aspect === 'RED' ? 'R' : aspect === 'GREEN' ? 'G' : 'Y';
        l2.dataset['letter'] = aspect === 'DOUBLE_YELLOW' ? 'Y' : '';
      } else {
        // Fog: like a fog safety device, the distance is known but not the colour.
        this.set('sigMeaning', 'Not in sight yet — be ready to stop');
        l1.className = 'lamp off';
        l2.className = 'lamp off';
      }
    } else {
      this.set('sigName', 'No signal ahead');
      this.set('sigMeaning', '');
      this.set('sigDist', '');
      l1.className = 'lamp off';
      l2.className = 'lamp off';
    }

    this.set('clock', formatClock(CLOCK_START_S + sim.timeS));
    const next = sim.playerNextStop();
    if (next) {
      const due = next.stop.dueS;
      const eta = due !== undefined ? ` · due ${formatClock(CLOCK_START_S + due).slice(0, 5)}` : '';
      const late =
        due !== undefined && sim.timeS > due ? ` (late ${formatMinSec(sim.timeS - due)})` : '';
      this.set(
        'next',
        `Next stop: ${next.station.name} in ${Math.max(0, next.distM).toFixed(0)} m${eta}${late}`,
      );
    } else {
      this.set('next', `${sim.player.label} · no more booked stops`);
    }
    this.set('hint', this.hint(sim));
  }

  handleEvents(events: SimEvent[], sim: Sim): void {
    for (const e of events) {
      switch (e.type) {
        case 'SPAD':
          if (e.fatal) {
            this.showOverlay('Signal passed at danger', sim.failReason, WHY['SPAD']!);
          } else {
            this.banner(
              `SPAD! ${e.label} passed at danger — STOP NOW`,
              'Emergency brake (Backspace)! The line ahead is not clear: another train or the points may be in your path.',
              'danger',
              12000,
            );
          }
          break;
        case 'SPAD_STOPPED':
          this.showOverlay('Signal passed at danger', sim.failReason, WHY['SPAD']!);
          break;
        case 'COLLISION':
          this.impactFlash();
          this.banner(
            e.kind === 'buffer'
              ? 'You hit the buffer stop!'
              : `COLLISION with the ${e.otherLabel ?? 'train ahead'}!`,
            `Impact at ${e.closingKmh.toFixed(0)} km/h closing speed.`,
            'danger',
            5000,
          );
          break;
        case 'DERAILMENT':
          this.impactFlash();
          this.banner(
            'DERAILED!',
            `${e.speedKmh.toFixed(0)} km/h where the limit was ${e.limitKmh} km/h.`,
            'danger',
            5000,
          );
          break;
        case 'BUFFER_BUMP':
          this.toast(
            `Buffer stop touched at ${e.speedKmh.toFixed(0)} km/h — stop shorter next time`,
            'warn',
          );
          break;
        case 'BUFFER_OVERRUN':
          this.showOverlay('Buffer stop overrun', sim.failReason, WHY['BUFFER']!);
          break;
        case 'CRASH_SETTLED':
          this.showInquiry(sim);
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
        case 'SIGNAL_CLEARED':
          if (e.stopped) {
            this.banner(
              `${e.label} is now ${e.aspect.replace('_', ' ')} — you may start`,
              'Sound one long horn (hold H), release the brakes and open the throttle.',
              'good',
            );
          } else {
            this.toast(`${e.label} cleared to ${e.aspect.replace('_', ' ')}`, 'good');
          }
          break;
        case 'ROUTED_LOOP':
          this.banner(
            `Routed into the ${e.stationName} loop`,
            e.forTrain
              ? `The ${e.forTrain} behind you has priority. Slow to 30 km/h, stop at the loop starter and wait for it to pass.`
              : 'Slow to 30 km/h and stop at the loop starter.',
            'warn',
          );
          break;
        case 'TRAIN_HELD_FOR_YOU':
          this.toast(
            `${e.trainLabel} is held in the ${e.stationName} loop so you can overtake`,
            'info',
          );
          break;
        case 'TRAIN_PASSING':
          this.toast(
            e.sameDirection
              ? `${e.trainLabel} overtaking on the main line`
              : `${e.trainLabel} passing on the down line`,
            'info',
          );
          break;
        case 'STATION_STOP': {
          const off = e.offsetM;
          const where =
            Math.abs(off) < 2
              ? 'right on the mark'
              : `${Math.abs(off).toFixed(1)} m ${off > 0 ? 'past' : 'short of'} the mark`;
          const time =
            e.lateS === undefined
              ? ''
              : e.lateS > 30
                ? ` · ${formatMinSec(e.lateS)} late`
                : ' · on time';
          this.toast(`Stopped at platform — ${where}${time}`, Math.abs(off) < 5 ? 'good' : 'info');
          break;
        }
        case 'END_OF_TRACK':
          this.showOverlay(
            'Journey complete',
            `You reached the end of the line at ${formatClock(CLOCK_START_S + sim.timeS)}.` +
              (this.journey.length ? ` Journey log: ${this.journey.join(' · ')}.` : '') +
              (sim.violations.length
                ? ` Violations: ${sim.violations.map((v) => v.text).join('; ')}.`
                : ' No rule violations.'),
            '',
          );
          break;
        case 'ZONE_ENTERED': {
          const z = ZONES.get(e.zoneId);
          if (!z) break;
          this.log(sim, z.name);
          this.toast(`Entering: ${z.name}`, 'info');
          this.fact(z.biome === 'ghat' ? 'ghat' : z.biome);
          break;
        }
        case 'LANDMARK': {
          const what =
            e.kind === 'river-bridge'
              ? `Crossing the ${e.name ?? 'river'} bridge`
              : e.kind === 'tunnel'
                ? `Entering ${e.name ?? 'a tunnel'}`
                : e.kind === 'viaduct'
                  ? `Over the ${e.name ?? 'viaduct'}`
                  : 'Level crossing — sound the horn';
          if (e.kind !== 'level-crossing')
            this.log(sim, what.replace(/^(Crossing|Entering|Over) the /, ''));
          this.toast(what, e.kind === 'level-crossing' ? 'warn' : 'info');
          if (e.kind === 'tunnel') this.fact('tunnel');
          break;
        }
        case 'VIOLATION':
          this.toast(`Violation: ${e.text}`, 'warn');
          break;
        case 'INCIDENT_SAY':
          if (e.line.speaker === 'cab')
            this.banner('ACP — alarm chain pulled', e.line.text, 'danger', 9000);
          break;
        case 'INCIDENT_DEBRIEF':
          this.showDebrief(e.debrief);
          this.fact(e.debrief.title.includes('alarm chain') ? 'acp' : 'incident');
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

  /** Large, longer-lived notification for things the driver must act on. */
  banner(
    title: string,
    text: string,
    kind: 'info' | 'warn' | 'good' | 'danger',
    durationMs = 7000,
  ): void {
    const b = this.el['banner']!;
    this.el['bannerTitle']!.textContent = title;
    this.el['bannerText']!.textContent = text;
    b.className = `banner show ${kind}`;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => (b.className = 'banner'), durationMs);
    this.onNotify();
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

  /** Caption for spoken announcements and radio (always shown, with who is speaking). */
  subtitle(speaker: string, text: string): void {
    this.set('subSpeaker', speaker);
    this.set('subText', text);
    this.el['subtitle']!.classList.add('show');
    clearTimeout(this.subtitleTimer);
    this.subtitleTimer = window.setTimeout(
      () => this.el['subtitle']!.classList.remove('show'),
      2500 + text.length * 70,
    );
  }

  /** Colour-blind aid: a letter (R / Y / G) on the signal lamps. */
  setColourAid(on: boolean): void {
    this.root.classList.toggle('aid', on);
  }

  /** Name of the region / landmark the train is in, for the journey line. */
  setPlace(text: string): void {
    this.set('place', text);
  }

  resetJourney(): void {
    this.journey.length = 0;
    this.factsShown.clear();
  }

  private log(sim: Sim, what: string): void {
    this.journey.push(`${formatClock(CLOCK_START_S + sim.timeS).slice(0, 5)} ${what}`);
  }

  /** A cited "Did you know?" card, once per topic. */
  private fact(trigger: string): void {
    const f = FACTS.find((x) => x.trigger === trigger && !this.factsShown.has(x.id));
    if (!f) return;
    this.factsShown.add(f.id);
    window.setTimeout(
      () =>
        this.banner(
          'Did you know?',
          `${f.text} (Source: ${new URL(f.source).hostname})`,
          'info',
          10000,
        ),
      4000,
    );
  }

  private showDebrief(d: Debrief): void {
    const o = this.el['overlay']!;
    o.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card debrief';
    const h = document.createElement('h2');
    h.textContent = d.title;
    const rows: [string, string][] = [
      ['What happened', d.what],
      ['Your response', d.yourResponse],
      ['Which rule applied', d.rule],
    ];
    card.append(h);
    for (const [k, v] of rows) {
      const p = document.createElement('p');
      const b = document.createElement('b');
      b.textContent = `${k}: `;
      p.append(b, document.createTextNode(v));
      card.append(p);
    }
    if (d.violations.length) {
      const p = document.createElement('p');
      p.className = 'cause';
      p.textContent = `Violation: ${d.violations.join(' ')}`;
      card.append(p);
    }
    const btn = document.createElement('button');
    btn.textContent = 'Continue the journey';
    btn.dataset['action'] = 'debrief-close';
    btn.addEventListener('click', () => (o.hidden = true));
    const actions = document.createElement('div');
    actions.className = 'cardActions';
    actions.append(btn);
    card.append(actions);
    o.append(card);
    o.hidden = false;
  }

  hideOverlay(): void {
    this.el['overlay']!.hidden = true;
    this.root.classList.remove('spadAlarm');
  }

  /** Hide the overlay while a replay plays (the card returns when it ends). */
  setOverlayVisible(on: boolean): void {
    this.el['overlay']!.hidden = !on;
  }

  private impactFlash(): void {
    const f = this.el['flash']!;
    f.classList.remove('on');
    void f.offsetWidth; // restart the animation
    f.classList.add('on');
  }

  /** The accident inquiry: what happened, why, and what it cost. */
  showInquiry(sim: Sim): void {
    const a = sim.accident;
    const crash = sim.crash;
    if (!a || !crash) return;
    const o = this.el['overlay']!;
    o.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card inquiry';
    const h = document.createElement('h2');
    h.textContent = `Accident inquiry — ${CRASH_TITLES[a.kind] ?? 'Accident'}`;
    const cause = document.createElement('p');
    cause.className = 'cause';
    cause.textContent = `Cause: ${a.cause}.`;
    const rows: [string, string][] = [
      ['Time', formatClock(CLOCK_START_S + a.timeS)],
      ['Your speed at impact', `${a.speedKmh.toFixed(0)} km/h`],
    ];
    if (a.otherLabel) {
      rows.push(['Other train', a.otherLabel]);
      rows.push(['Closing speed', `${a.closingKmh.toFixed(0)} km/h`]);
    }
    if (a.limitKmh !== undefined) rows.push(['Speed limit there', `${a.limitKmh} km/h`]);
    if (a.spad) {
      rows.push([
        'Timeline',
        `SPAD at ${formatClock(CLOCK_START_S + a.spad.timeS)} → impact ${(a.timeS - a.spad.timeS).toFixed(0)} s later`,
      ]);
    }
    rows.push(['Vehicles derailed', String(crash.derailedCount())]);
    rows.push(['Bogies torn off', String(crash.detachedBogieCount())]);
    rows.push(['Debris pieces', String(crash.debrisLaunched)]);
    const table = document.createElement('table');
    for (const [k, v] of rows) {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.textContent = k;
      const td2 = document.createElement('td');
      td2.textContent = v;
      tr.append(td1, td2);
      table.append(tr);
    }
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent =
      a.kind === 'derailment'
        ? WHY['DERAILMENT']!
        : a.kind === 'buffer' && !a.spad
          ? WHY['BUFFER']!
          : WHY['SPAD']!;
    const buttons = document.createElement('div');
    buttons.className = 'cardActions';
    const replay = document.createElement('button');
    replay.textContent = 'Replay crash (R)';
    replay.dataset['action'] = 'replay';
    replay.addEventListener('click', () => this.onReplay());
    const restart = document.createElement('button');
    restart.textContent = 'Restart (Enter)';
    restart.dataset['action'] = 'restart';
    restart.addEventListener('click', () => this.onRestart());
    buttons.append(replay, restart);
    const note = document.createElement('p');
    note.className = 'keys';
    note.textContent = 'Keys 1–4 look around the wreck · each replay shows a new angle.';
    card.append(h, cause, table, why, buttons, note);
    o.append(card);
    o.hidden = false;
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
    const hold = sim.playerHold();
    if (hold?.kind === 'overtake') return `Held: wait for the ${hold.byTrain} to pass`;
    if (hold?.kind === 'dwell')
      return `Dwell at platform: ${Math.ceil(hold.leftS)} s — then wait for the starter`;
    if (hold?.kind === 'not-at-mark') return 'Draw up to the STOP mark to start your dwell';
    const view = sim.nextSignalView();
    const loop = sim.net.loops.find(
      (l) => sim.player.loopRoutes.get(l.stationId) === l.lineId && l.fromM > sim.train.s,
    );
    if (loop?.platform !== undefined) {
      const lim = sim.net.speedLimitKmh(loop.lineId);
      return `Routed to platform ${loop.platform} ahead: ${lim ?? 30} km/h over the points`;
    }
    if (loop) return `Routed into the loop ahead: 30 km/h, stop at the loop starter`;
    if (sim.train.v === 0 && view && view.aspect === 'RED' && view.distM < 400) {
      return `Wait at ${view.def.label} until it clears`;
    }
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

function formatMinSec(totalS: number): string {
  const s = Math.max(0, Math.round(totalS));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatClock(totalS: number): string {
  const s = Math.floor(totalS) % 86400;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
