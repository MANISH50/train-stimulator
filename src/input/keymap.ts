// Default key bindings (KeyboardEvent.code). Remappable: override entries and persist later.
export type Action =
  | 'notchUp'
  | 'notchDown'
  | 'autoBrakeApply'
  | 'autoBrakeRelease'
  | 'indepApply'
  | 'indepRelease'
  | 'emergency'
  | 'reverser'
  | 'horn'
  | 'camera'
  | 'camCab'
  | 'camChase'
  | 'camSide'
  | 'camTop'
  | 'perf'
  | 'quality'
  | 'help'
  | 'pause'
  | 'restart';

export const DEFAULT_KEYMAP: Record<Action, string[]> = {
  notchUp: ['KeyW', 'ArrowUp'],
  notchDown: ['KeyS', 'ArrowDown'],
  autoBrakeApply: ['BracketRight'],
  autoBrakeRelease: ['BracketLeft'],
  indepApply: ['Quote'],
  indepRelease: ['Semicolon'],
  emergency: ['Backspace'],
  reverser: ['KeyR'],
  horn: ['KeyH', 'Space'],
  camera: ['KeyC'],
  camCab: ['Digit1'],
  camChase: ['Digit2'],
  camSide: ['Digit3'],
  camTop: ['Digit4'],
  perf: ['F3'],
  quality: ['KeyQ'],
  help: ['F1', 'Slash'],
  pause: ['KeyP', 'Escape'],
  restart: ['Enter'],
};

export const ACTION_LABELS: Record<Action, string> = {
  notchUp: 'Throttle notch up',
  notchDown: 'Throttle notch down',
  autoBrakeApply: 'Train (automatic) brake — apply (hold)',
  autoBrakeRelease: 'Train (automatic) brake — release (hold)',
  indepApply: 'Loco (independent) brake — apply (hold)',
  indepRelease: 'Loco (independent) brake — release (hold)',
  emergency: 'Emergency brake (press again when stopped to reset)',
  reverser: 'Reverser F / N / R (only at standstill, notch 0)',
  horn: 'Horn (hold; short/long blasts make whistle codes)',
  camera: 'Cycle camera views',
  camCab: 'Cab — pilot view with console (drag to look, double-click to recentre)',
  camChase: 'Chase view (drag to orbit, wheel to zoom)',
  camSide: 'Side view (drag to slide along the train, wheel for distance)',
  camTop: 'Top view (wheel for height)',
  perf: 'Performance overlay',
  quality: 'Cycle quality preset',
  help: 'Show / hide controls',
  pause: 'Pause',
  restart: 'Restart run',
};

export function keyLabel(code: string): string {
  const named: Record<string, string> = {
    BracketRight: ']',
    BracketLeft: '[',
    Quote: "'",
    Semicolon: ';',
    Slash: '?',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Space: 'Space',
  };
  return named[code] ?? code.replace(/^(Key|Digit)/, '');
}
