// Gameplay effects of weather. Wet-rail adhesion is from docs/research/02-train-physics.md
// (dry 0.30-0.35, wet 0.15-0.20). The fog speed cap mirrors a news-reported 75 km/h limit with
// fog safety devices (docs/research/01 §6, UNVERIFIED) and is used here as a game rule.
import type { WeatherId } from './types';

export interface WeatherEffects {
  label: string;
  description: string;
  /** Multiplier on the loco's dry adhesion coefficient. */
  adhesionFactor: number;
  /** Multiplier on train brake force (wheel/rail grip in rain; game tuning, UNVERIFIED). */
  brakeFactor: number;
  /** Distance at which a signal's colour can be read (m). */
  visibilityM: number;
  /** Game-rule speed cap (km/h), if any. */
  speedCapKmh?: number;
}

export const WEATHER: Record<WeatherId, WeatherEffects> = {
  clear: {
    label: 'Clear day',
    description: 'Good visibility, dry rail.',
    adhesionFactor: 1,
    brakeFactor: 1,
    visibilityM: 5000,
  },
  haze: {
    label: 'Summer haze',
    description: 'Hot and hazy; signals visible from about 1.5 km.',
    adhesionFactor: 1,
    brakeFactor: 1,
    visibilityM: 1500,
  },
  rain: {
    label: 'Monsoon rain',
    description: 'Wet rail: wheel slip and longer braking.',
    adhesionFactor: 0.6,
    brakeFactor: 0.85,
    visibilityM: 900,
  },
  fog: {
    label: 'Winter fog',
    description: 'Signals only readable within ~250 m. Fog caution: 75 km/h (game rule).',
    adhesionFactor: 0.9,
    brakeFactor: 1,
    visibilityM: 250,
    speedCapKmh: 75,
  },
  night: {
    label: 'Night',
    description: 'Dark; follow the signal lamps and your headlight.',
    adhesionFactor: 1,
    brakeFactor: 1,
    visibilityM: 3000,
  },
};

export const WEATHER_ORDER: WeatherId[] = ['clear', 'haze', 'rain', 'fog', 'night'];

export interface PhysicsEnv {
  adhesionFactor: number;
  brakeFactor: number;
}

export const DRY_ENV: PhysicsEnv = { adhesionFactor: 1, brakeFactor: 1 };
