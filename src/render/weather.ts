// Weather and time-of-day visuals: sky, light levels, fog, rain streaks and stars.
import * as THREE from 'three';
import type { WeatherId } from '../sim/types';

export interface WeatherLook {
  sunElevationDeg: number;
  turbidity: number;
  rayleigh: number;
  sunIntensity: number;
  hemiIntensity: number;
  exposure: number;
  fogColor: number;
  /** Fog distances as fractions of the preset view distance, or absolute metres if `fogAbsolute`. */
  fogNear: number;
  fogFar: number;
  fogAbsolute?: boolean;
  /** Replace the sky dome with a flat background (thick fog, rain). */
  flatSky?: number;
  rain?: boolean;
  stars?: boolean;
  headlight: number;
  signalGlow: number;
  platformLamps?: boolean;
}

export const WEATHER_LOOKS: Record<WeatherId, WeatherLook> = {
  clear: {
    sunElevationDeg: 22,
    turbidity: 6,
    rayleigh: 1.6,
    sunIntensity: 2.6,
    hemiIntensity: 0.9,
    exposure: 0.75,
    fogColor: 0xd8c9a8,
    fogNear: 0.25,
    fogFar: 1,
    headlight: 0,
    signalGlow: 1.8,
  },
  haze: {
    sunElevationDeg: 35,
    turbidity: 14,
    rayleigh: 0.9,
    sunIntensity: 2.2,
    hemiIntensity: 1.0,
    exposure: 0.8,
    fogColor: 0xd9c49a,
    fogNear: 150,
    fogFar: 1800,
    fogAbsolute: true,
    headlight: 0,
    signalGlow: 2.2,
  },
  rain: {
    sunElevationDeg: 18,
    turbidity: 20,
    rayleigh: 0.4,
    sunIntensity: 0.7,
    hemiIntensity: 0.65,
    exposure: 0.85,
    fogColor: 0x7f878d,
    fogNear: 60,
    fogFar: 1100,
    fogAbsolute: true,
    flatSky: 0x737b82,
    rain: true,
    headlight: 2.5,
    signalGlow: 2.6,
  },
  fog: {
    sunElevationDeg: 10,
    turbidity: 20,
    rayleigh: 0.3,
    sunIntensity: 0.5,
    hemiIntensity: 0.8,
    exposure: 0.8,
    fogColor: 0xc5c9cc,
    fogNear: 15,
    fogFar: 330,
    fogAbsolute: true,
    flatSky: 0xc5c9cc,
    headlight: 3,
    signalGlow: 3.2,
  },
  night: {
    sunElevationDeg: -8,
    turbidity: 2,
    rayleigh: 0.6,
    sunIntensity: 0.18,
    hemiIntensity: 0.18,
    exposure: 1.0,
    fogColor: 0x0b1220,
    fogNear: 200,
    fogFar: 2600,
    fogAbsolute: true,
    stars: true,
    headlight: 6,
    signalGlow: 3.4,
    platformLamps: true,
  },
};

const RAIN_DROPS = 2500;
const RAIN_BOX = { x: 90, y: 50, z: 90 };

/** Falling rain streaks in a box that follows the camera (one draw call). */
export class Rain {
  readonly lines: THREE.LineSegments;
  private readonly pos: Float32Array;
  private readonly seeds: Float32Array;

  constructor() {
    this.pos = new Float32Array(RAIN_DROPS * 6);
    this.seeds = new Float32Array(RAIN_DROPS * 3);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < RAIN_DROPS; i++) {
      this.seeds[i * 3] = (rnd() - 0.5) * RAIN_BOX.x;
      this.seeds[i * 3 + 1] = rnd() * RAIN_BOX.y;
      this.seeds[i * 3 + 2] = (rnd() - 0.5) * RAIN_BOX.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.lines = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: 0xaab4bd, transparent: true, opacity: 0.45 }),
    );
    this.lines.frustumCulled = false;
    this.lines.visible = false;
  }

  update(dt: number, camera: THREE.Camera): void {
    if (!this.lines.visible) return;
    const c = camera.position;
    for (let i = 0; i < RAIN_DROPS; i++) {
      let y = this.seeds[i * 3 + 1]! - dt * 22;
      if (y < 0) y += RAIN_BOX.y;
      this.seeds[i * 3 + 1] = y;
      const x = c.x + this.seeds[i * 3]!;
      const z = c.z + this.seeds[i * 3 + 2]!;
      const wy = c.y - RAIN_BOX.y / 2 + y;
      this.pos.set([x, wy, z, x + 0.15, wy + 1.1, z], i * 6);
    }
    (this.lines.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** A star field on a sphere that follows the camera. */
export function buildStars(): THREE.Points {
  const n = 1500;
  const pos = new Float32Array(n * 3);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const t = rnd() * Math.PI * 2;
    const y = Math.abs(u) * 0.95 + 0.05; // upper hemisphere only
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(t) * r * 2000, y * 2000, Math.sin(t) * r * 2000], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false }),
  );
  stars.frustumCulled = false;
  stars.visible = false;
  return stars;
}
