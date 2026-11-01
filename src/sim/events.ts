import type { Aspect } from './types';

export type SimEvent =
  | { type: 'SPAD'; timeS: number; signalId: string; speedKmh: number }
  | { type: 'SIGNAL_PASSED'; timeS: number; signalId: string; aspect: Aspect }
  | { type: 'OVERSPEED'; timeS: number; speedKmh: number; limitKmh: number }
  | { type: 'OVERSPEED_CLEARED'; timeS: number }
  | { type: 'STATION_STOP'; timeS: number; stationId: string; offsetM: number }
  | { type: 'END_OF_TRACK'; timeS: number };

export type SimEventType = SimEvent['type'];
