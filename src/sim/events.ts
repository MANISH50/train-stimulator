import type { Aspect } from './types';

export type SimEvent =
  | { type: 'SPAD'; timeS: number; signalId: string; speedKmh: number }
  | { type: 'SIGNAL_PASSED'; timeS: number; signalId: string; aspect: Aspect }
  | {
      type: 'SIGNAL_CLEARED';
      timeS: number;
      signalId: string;
      label: string;
      aspect: Aspect;
      /** True when the player's train was standing at the time. */
      stopped: boolean;
    }
  | {
      type: 'ROUTED_LOOP';
      timeS: number;
      stationId: string;
      stationName: string;
      forTrain?: string;
    }
  | { type: 'TRAIN_HELD_FOR_YOU'; timeS: number; trainLabel: string; stationName: string }
  | { type: 'TRAIN_PASSING'; timeS: number; trainLabel: string; sameDirection: boolean }
  | { type: 'OVERSPEED'; timeS: number; speedKmh: number; limitKmh: number }
  | { type: 'OVERSPEED_CLEARED'; timeS: number }
  | { type: 'STATION_STOP'; timeS: number; stationId: string; offsetM: number; lateS?: number }
  | { type: 'END_OF_TRACK'; timeS: number };

export type SimEventType = SimEvent['type'];
