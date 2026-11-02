// Start menu: choose a level, weather, starting camera and graphics quality, then Play.
import type { CameraMode } from '../render/scene';
import type { QualityName } from '../render/quality';
import { ACTION_LABELS, DEFAULT_KEYMAP, keyLabel, type Action } from '../input/keymap';
import { LEVELS, trainType } from '../content/catalog';
import type { WeatherId } from '../sim/types';
import { WEATHER, WEATHER_ORDER } from '../sim/weather';
import './menu.css';

export interface MenuChoice {
  levelId: string;
  camera: CameraMode;
  quality: QualityName;
  weather: WeatherId;
  /** Realistic consequences: SPADs and overspeed can end in a collision or derailment. */
  accidents: boolean;
}

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
    const first = LEVELS[0]!;
    this.choice = {
      levelId: first.id,
      camera: 'cab',
      quality,
      weather: first.defaultWeather,
      accidents: true,
    };
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
        <h3>Choose your journey — all levels unlocked</h3>
        <div class="journeys">
          ${LEVELS.map((l) => {
            const t = trainType(l.player.trainTypeId);
            return `
            <button class="journey ${l.id === c.levelId ? 'selected' : ''}" data-level="${l.id}">
              <b>${l.order}. ${l.title}</b><small>${l.subtitle}</small><span>${l.detail}</span>
              <em>${t.name}: ${t.speciality}</em>
            </button>`;
          }).join('')}
        </div>
        <h3>Weather</h3>
        <div class="seg">${WEATHER_ORDER.map((w) => `<button data-weather="${w}" class="${w === c.weather ? 'on' : ''}" title="${WEATHER[w].description}">${WEATHER[w].label}</button>`).join('')}</div>
        <p class="weatherNote">${WEATHER[c.weather].description}</p>
        <div class="options">
          <div>
            <h3>Starting camera</h3>
            <div class="seg">${CAMERAS.map((o) => `<button data-camera="${o.id}" class="${o.id === c.camera ? 'on' : ''}">${o.label}</button>`).join('')}</div>
          </div>
          <div>
            <h3>Accidents</h3>
            <div class="seg">
              <button data-accidents="on" class="${c.accidents ? 'on' : ''}" title="Run a red signal and you keep going — into whatever is ahead. Overspeed on points derails.">On — real consequences</button>
              <button data-accidents="off" class="${c.accidents ? '' : 'on'}" title="Training: the run stops the moment you pass a red signal.">Off — stop at once</button>
            </div>
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

    this.el.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((b) =>
      b.addEventListener('click', () => {
        const level = LEVELS.find((l) => l.id === b.dataset['level'])!;
        this.choice.levelId = level.id;
        this.choice.weather = level.defaultWeather;
        this.render();
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach((b) =>
      b.addEventListener('click', () => {
        this.choice.weather = b.dataset['weather'] as WeatherId;
        this.render();
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach((b) =>
      b.addEventListener('click', () => {
        this.choice.camera = b.dataset['camera'] as CameraMode;
        this.render();
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-accidents]').forEach((b) =>
      b.addEventListener('click', () => {
        this.choice.accidents = b.dataset['accidents'] === 'on';
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
