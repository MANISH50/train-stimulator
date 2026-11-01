// Start menu: choose a journey, starting camera and graphics quality, then press Play.
import type { CameraMode } from '../render/scene';
import type { QualityName } from '../render/quality';
import { ACTION_LABELS, DEFAULT_KEYMAP, keyLabel, type Action } from '../input/keymap';
import './menu.css';

export interface MenuChoice {
  journey: string;
  camera: CameraMode;
  quality: QualityName;
}

interface Journey {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  available: boolean;
}

const JOURNEYS: Journey[] = [
  {
    id: 'training',
    title: 'Training Ground',
    subtitle: 'Electric passenger · 12 coaches',
    detail: '4.2 km test section: signals, a 50 km/h restriction and a platform stop.',
    available: true,
  },
  {
    id: 'intercity',
    title: 'Intercity Express',
    subtitle: 'High speed · few stops',
    detail: 'Long runs with strict punctuality.',
    available: false,
  },
  {
    id: 'suburban',
    title: 'Suburban Local',
    subtitle: 'Frequent stops · peak traffic',
    detail: 'Short gaps and precise platform stopping.',
    available: false,
  },
  {
    id: 'mail',
    title: 'Mail / Passenger',
    subtitle: 'Mixed stops · varied terrain',
    detail: 'Moderate priority across changing gradients.',
    available: false,
  },
  {
    id: 'goods',
    title: 'Goods Train',
    subtitle: 'Heavy freight · long braking',
    detail: 'Slow acceleration and frequent holds.',
    available: false,
  },
];

const CAMERAS: { id: CameraMode; label: string }[] = [
  { id: 'cab', label: 'Cab (pilot view)' },
  { id: 'chase', label: 'Chase' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Top' },
];

const QUALITIES: { id: QualityName; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

/** The essentials, in the order a first drive needs them. */
export const QUICK_KEYS: [string, string][] = [
  ['; (hold)', '1. Release the loco brake (it is on at the start)'],
  ['W / S', '2. Throttle notch up / down'],
  ['] (hold)', 'Apply train brake — [ (hold) releases it'],
  ["' (hold)", 'Apply loco brake'],
  ['Backspace', 'Emergency brake'],
  ['R', 'Reverser F / N / R (stopped, notch 0)'],
  ['H (hold)', 'Horn — short / long blasts = whistle codes'],
  ['1 2 3 4', 'Camera: Cab · Chase · Side · Top (or C to cycle)'],
  ['Mouse drag', 'Look around (cab) / orbit (chase)'],
  ['F1', 'All controls'],
  ['P', 'Pause'],
  ['Esc', 'Menu'],
];

export class StartMenu {
  private readonly el: HTMLElement;
  private choice: MenuChoice;
  private onPlay: (c: MenuChoice, restart: boolean) => void = () => {};
  private showHelp = false;

  constructor(parent: HTMLElement, quality: QualityName) {
    this.choice = { journey: 'training', camera: 'cab', quality };
    this.el = document.createElement('div');
    this.el.className = 'menu';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'Start menu');
    parent.append(this.el);
    this.render();
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  show(resume: boolean): void {
    this.el.hidden = false;
    this.el.dataset['resume'] = resume ? '1' : '';
    this.render();
  }

  hide(): void {
    this.el.hidden = true;
  }

  /** `restart` is true when the player chose "Restart journey" from the in-game menu. */
  onStart(onPlay: (c: MenuChoice, restart: boolean) => void): void {
    this.onPlay = onPlay;
  }

  private render(): void {
    const resume = this.el.dataset['resume'] === '1';
    const c = this.choice;
    this.el.innerHTML = `
      <div class="menu-card">
        <header>
          <div class="brand">Indian Train <span>Loco Pilot Simulator</span></div>
          <p class="tag">Drive by the signals. Reach every station on time and safely.</p>
        </header>
        <h3>Choose your journey</h3>
        <div class="journeys">
          ${JOURNEYS.map(
            (j) => `
            <button class="journey ${j.id === c.journey ? 'selected' : ''}" data-journey="${j.id}" ${j.available ? '' : 'disabled'}>
              <b>${j.title}</b><small>${j.subtitle}</small><span>${j.detail}</span>
              ${j.available ? '' : '<em>Coming soon</em>'}
            </button>`,
          ).join('')}
        </div>
        <div class="options">
          <div>
            <h3>Starting camera</h3>
            <div class="seg">${CAMERAS.map((o) => `<button data-camera="${o.id}" class="${o.id === c.camera ? 'on' : ''}">${o.label}</button>`).join('')}</div>
          </div>
          <div>
            <h3>Graphics</h3>
            <div class="seg">${QUALITIES.map((o) => `<button data-quality="${o.id}" class="${o.id === c.quality ? 'on' : ''}">${o.label}</button>`).join('')}</div>
          </div>
        </div>
        <h3>How to drive</h3>
        <div class="quickKeys">${QUICK_KEYS.map(([k, what]) => `<div><kbd>${k}</kbd><span>${what}</span></div>`).join('')}</div>
        <div class="actions">
          <button class="play" data-action="play">${resume ? 'Resume' : 'Play'}</button>
          ${resume ? '<button class="secondary" data-action="restart">Restart journey</button>' : ''}
          <button class="secondary" data-action="controls">Controls</button>
        </div>
        ${this.showHelp ? controlsTable() : ''}
        <p class="fine">Unofficial game, not affiliated with Indian Railways. You can change the camera any time with the buttons at the top right or keys 1–4.</p>
      </div>`;

    this.el.querySelectorAll<HTMLButtonElement>('[data-journey]').forEach((b) =>
      b.addEventListener('click', () => {
        this.choice.journey = b.dataset['journey']!;
        this.render();
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach((b) =>
      b.addEventListener('click', () => {
        this.choice.camera = b.dataset['camera'] as CameraMode;
        this.render();
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-quality]').forEach((b) =>
      b.addEventListener('click', () => {
        this.choice.quality = b.dataset['quality'] as QualityName;
        this.render();
      }),
    );
    this.el
      .querySelector('[data-action="play"]')!
      .addEventListener('click', () => this.onPlay({ ...this.choice }, false));
    this.el
      .querySelector('[data-action="restart"]')
      ?.addEventListener('click', () => this.onPlay({ ...this.choice }, true));
    this.el.querySelector('[data-action="controls"]')!.addEventListener('click', () => {
      this.showHelp = !this.showHelp;
      this.render();
    });
  }
}

function controlsTable(): string {
  const rows = (Object.keys(ACTION_LABELS) as Action[])
    .map(
      (a) =>
        `<tr><td>${DEFAULT_KEYMAP[a].map(keyLabel).join(' / ')}</td><td>${ACTION_LABELS[a]}</td></tr>`,
    )
    .join('');
  return `<div class="menu-help"><table>${rows}</table></div>`;
}
