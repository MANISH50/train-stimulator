import type { Controls } from '../sim/types';
import { DEFAULT_KEYMAP, type Action } from './keymap';

const HANDLE_RATE_PER_S = 0.6;
const HELD: ReadonlySet<Action> = new Set([
  'autoBrakeApply',
  'autoBrakeRelease',
  'indepApply',
  'indepRelease',
  'horn',
]);

/** Turns keyboard state into sim Controls and one-shot UI actions. */
export class Input {
  private readonly byCode = new Map<string, Action>();
  private readonly held = new Set<Action>();
  private readonly pressed: Action[] = [];

  constructor(target: Window, keymap: Record<Action, string[]> = DEFAULT_KEYMAP) {
    for (const [action, codes] of Object.entries(keymap) as [Action, string[]][]) {
      for (const code of codes) this.byCode.set(code, action);
    }
    target.addEventListener('keydown', (e) => {
      const action = this.byCode.get(e.code);
      if (!action) return;
      e.preventDefault();
      if (!e.repeat) this.pressed.push(action);
      if (HELD.has(action)) this.held.add(action);
    });
    target.addEventListener('keyup', (e) => {
      const action = this.byCode.get(e.code);
      if (action) this.held.delete(action);
    });
    target.addEventListener('blur', () => this.held.clear());
  }

  isHeld(action: Action): boolean {
    return this.held.has(action);
  }

  /** One-shot presses since the last call. */
  takePressed(): Action[] {
    return this.pressed.splice(0);
  }

  /** Apply held brake handles to the controls for this frame. */
  updateHandles(ctl: Controls, notches: number, dtS: number): void {
    const d = HANDLE_RATE_PER_S * dtS;
    if (this.held.has('autoBrakeApply')) ctl.autoBrake = Math.min(1, ctl.autoBrake + d);
    if (this.held.has('autoBrakeRelease')) ctl.autoBrake = Math.max(0, ctl.autoBrake - d);
    if (this.held.has('indepApply')) ctl.indepBrake = Math.min(1, ctl.indepBrake + d);
    if (this.held.has('indepRelease')) ctl.indepBrake = Math.max(0, ctl.indepBrake - d);
    ctl.notch = Math.max(0, Math.min(notches, ctl.notch));
  }
}
