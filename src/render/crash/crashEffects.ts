// Visual effects for a crash: flying debris (from the crash sim), sparks and dust at each
// impact, smoke from damaged power units, and camera shake. One instanced mesh for debris,
// one point cloud for sparks and a small sprite pool for dust and smoke. Effects are seeded
// from the crash, so a replay looks the same.
import * as THREE from 'three';
import type { CrashSim } from '../../sim/crash/crashSim';
import { mulberry32 } from '../../sim/rng';
import type { Track } from '../../sim/track/track';
import { glowTexture } from '../textures';
import { frameAt, headingAt } from '../trackMesh';
import { bodyPoint } from './pose';

const MAX_SPARKS = 400;
const SPARKS_PER_IMPACT = 36;
const PUFFS = 28;
const GRAVITY = 9.81;

interface Puff {
  sprite: THREE.Sprite;
  age: number;
  life: number;
  grow: number;
  rise: number;
  start: number;
  alpha: number;
}

export class CrashEffects {
  readonly root = new THREE.Group();
  private readonly debris: THREE.InstancedMesh;
  private readonly sparkGeo = new THREE.BufferGeometry();
  private readonly sparkPos = new Float32Array(MAX_SPARKS * 3);
  private readonly sparkVel = new Float32Array(MAX_SPARKS * 3);
  private readonly sparkLife = new Float32Array(MAX_SPARKS);
  private sparkNext = 0;
  private readonly puffs: Puff[] = [];
  private puffNext = 0;
  private crash: CrashSim | null = null;
  private seenImpacts = 0;
  private rng = mulberry32(1);
  private smokeTimer = 0;
  /** Current camera-shake amplitude (m). */
  shake = 0;
  private readonly m = new THREE.Matrix4();
  private readonly p = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler();
  private readonly sc = new THREE.Vector3();
  private readonly c = new THREE.Color();

  constructor() {
    this.root.name = 'crashEffects';
    this.debris = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.3 }),
      160,
    );
    this.debris.count = 0;
    this.debris.frustumCulled = false;
    this.debris.castShadow = true;
    for (let i = 0; i < 160; i++) this.debris.setColorAt(i, this.c.set(0xffffff));

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
    const sparks = new THREE.Points(
      this.sparkGeo,
      new THREE.PointsMaterial({
        color: 0xffc46a,
        size: 0.35,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sparks.frustumCulled = false;
    this.sparkLife.fill(0);
    this.sparkPos.fill(-1e5);

    const tex = glowTexture();
    for (let i = 0; i < PUFFS; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          color: 0x9a8a72,
          transparent: true,
          depthWrite: false,
        }),
      );
      sprite.visible = false;
      this.puffs.push({ sprite, age: 0, life: 1, grow: 1, rise: 0, start: 1, alpha: 0 });
      this.root.add(sprite);
    }
    this.root.add(this.debris, sparks);
    this.root.visible = false;
  }

  /** Show effects for a crash (or a replay of it); null hides them. Resets on a new crash. */
  setCrash(crash: CrashSim | null): void {
    if (crash === this.crash) return;
    this.crash = crash;
    this.root.visible = !!crash;
    this.seenImpacts = 0;
    this.sparkLife.fill(0);
    this.sparkPos.fill(-1e5);
    this.sparkGeo.attributes['position']!.needsUpdate = true;
    for (const p of this.puffs) {
      p.sprite.visible = false;
      p.age = p.life;
    }
    this.debris.count = 0;
    this.shake = 0;
    this.smokeTimer = 0;
    if (crash) this.rng = mulberry32(crash.setup.seed ^ 0x5eed);
  }

  /** Advance by `dt` of crash time and redraw. */
  update(track: Track, dt: number): void {
    const crash = this.crash;
    if (!crash) return;
    // New impacts → sparks, dust and shake.
    const ring = crash.impacts.length;
    const first = Math.max(this.seenImpacts, crash.impactCount - ring);
    for (let i = first; i < crash.impactCount; i++) {
      const imp = crash.impacts[i % ring]!;
      frameAt(track, imp.s, imp.y, imp.z, this.p);
      this.burstSparks(this.p, imp.strength);
      if (imp.strength > 0.15)
        this.puff(this.p, 0x9a8a72, 0.55 * imp.strength + 0.2, 4 + 10 * imp.strength, 3.5, 0.6);
      this.shake = Math.min(1.2, this.shake + imp.strength * 0.8);
    }
    this.seenImpacts = crash.impactCount;
    this.shake *= Math.exp(-dt * 3);

    this.updateSparks(dt);
    this.updatePuffs(dt);
    this.updateSmoke(track, dt);
    this.updateDebris(track);
  }

  private burstSparks(at: THREE.Vector3, strength: number): void {
    const n = Math.round(SPARKS_PER_IMPACT * Math.min(1, 0.3 + strength));
    for (let k = 0; k < n; k++) {
      const i = this.sparkNext;
      this.sparkNext = (this.sparkNext + 1) % MAX_SPARKS;
      const a = this.rng() * Math.PI * 2;
      const up = 2 + this.rng() * 7;
      const out = 3 + this.rng() * 9;
      this.sparkPos.set([at.x, at.y, at.z], i * 3);
      this.sparkVel.set([Math.cos(a) * out, up, Math.sin(a) * out], i * 3);
      this.sparkLife[i] = 0.4 + this.rng() * 0.8;
    }
  }

  private updateSparks(dt: number): void {
    const pos = this.sparkPos;
    const vel = this.sparkVel;
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (this.sparkLife[i]! <= 0) continue;
      this.sparkLife[i]! -= dt;
      if (this.sparkLife[i]! <= 0) {
        pos[i * 3 + 1] = -1e5;
        continue;
      }
      vel[i * 3 + 1]! -= GRAVITY * dt;
      pos[i * 3]! += vel[i * 3]! * dt;
      pos[i * 3 + 1]! += vel[i * 3 + 1]! * dt;
      pos[i * 3 + 2]! += vel[i * 3 + 2]! * dt;
    }
    this.sparkGeo.attributes['position']!.needsUpdate = true;
  }

  private puff(
    at: THREE.Vector3,
    colour: number,
    alpha: number,
    size: number,
    life: number,
    rise: number,
  ): void {
    const p = this.puffs[this.puffNext]!;
    this.puffNext = (this.puffNext + 1) % PUFFS;
    p.sprite.position.set(
      at.x + (this.rng() - 0.5) * 3,
      at.y + 1 + this.rng(),
      at.z + (this.rng() - 0.5) * 3,
    );
    p.sprite.material.color.setHex(colour);
    p.age = 0;
    p.life = life * (0.8 + this.rng() * 0.4);
    p.start = size * 0.35;
    p.grow = size;
    p.rise = rise;
    p.alpha = alpha;
    p.sprite.visible = true;
  }

  private updatePuffs(dt: number): void {
    for (const p of this.puffs) {
      if (!p.sprite.visible) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.sprite.visible = false;
        continue;
      }
      const t = p.age / p.life;
      p.sprite.scale.setScalar(p.start + (p.grow - p.start) * Math.sqrt(t));
      p.sprite.position.y += p.rise * dt;
      p.sprite.material.opacity = p.alpha * (1 - t) * Math.min(1, t * 8);
    }
  }

  /** Damaged power units smoke for a while after the crash. */
  private updateSmoke(track: Track, dt: number): void {
    const crash = this.crash!;
    if (crash.timeS > 40) return;
    this.smokeTimer -= dt;
    if (this.smokeTimer > 0) return;
    this.smokeTimer = 0.45;
    for (const b of crash.bodies) {
      if (b.kind !== 'loco' || b.damage < 0.25) continue;
      bodyPoint(track, b, b.lengthM / 2 - 3 - b.crushFront, 4, this.p);
      this.puff(this.p, 0x3a3634, 0.45, 9, 6, 2.2);
    }
  }

  private updateDebris(track: Track): void {
    const crash = this.crash!;
    let n = 0;
    for (const d of crash.debris) {
      if (!d.active) continue;
      frameAt(track, d.s, d.y, d.z, this.p);
      this.e.set(d.rx, headingAt(track, d.s) + d.ry, d.rz);
      this.q.setFromEuler(this.e);
      switch (d.kind) {
        case 0:
          this.sc.set(d.size, 0.06, d.size * 0.7);
          break;
        case 1:
          this.sc.set(d.size, d.size * 0.6, 0.03);
          break;
        case 3:
          this.sc.set(2.2, 0.08, 0.1);
          break;
        default:
          this.sc.set(d.size * 0.6, d.size * 0.35, d.size * 0.5);
      }
      this.debris.setMatrixAt(n, this.m.compose(this.p, this.q, this.sc));
      this.debris.setColorAt(n, this.c.setHex(d.colour));
      n++;
    }
    this.debris.count = n;
    this.debris.instanceMatrix.needsUpdate = true;
    if (this.debris.instanceColor) this.debris.instanceColor.needsUpdate = true;
  }

  dispose(): void {
    this.debris.geometry.dispose();
    (this.debris.material as THREE.Material).dispose();
    this.sparkGeo.dispose();
    for (const p of this.puffs) p.sprite.material.dispose();
  }
}
