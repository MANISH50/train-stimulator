import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import type { Consist } from '../sim/physics/forces';
import type { Sim } from '../sim/sim';
import type { AiTrain } from '../sim/traffic/aiTrain';
import type { Dir, TrainType } from '../sim/types';
import { PRESETS, type QualityName, type QualityPreset } from './quality';
import { buildTrack, frameAt, headingAt } from './trackMesh';
import { TrainModel, type TrainLook } from './trainModel';
import { Rain, WEATHER_LOOKS, buildStars, type WeatherLook } from './weather';
import { SignalBank, buildGround, buildSpeedBoards, buildStations, buildTrees } from './world';

export type CameraMode = 'cab' | 'chase' | 'side' | 'top';

export const CAMERA_MODES: CameraMode[] = ['cab', 'chase', 'side', 'top'];
export const CAMERA_NAMES: Record<CameraMode, string> = {
  cab: 'Cab — pilot view',
  chase: 'Chase view',
  side: 'Side view',
  top: 'Top view',
};

const UP = new THREE.Vector3(0, 1, 0);
const CAB_BASE_PITCH = -0.12;

export function lookFor(
  type: Pick<TrainType, 'livery' | 'locoLivery'>,
  consist: Consist,
  isPlayer: boolean,
): TrainLook {
  const rake = consist.rake.style ?? 'coach';
  return {
    loco: rake === 'emu' ? 'emu' : consist.loco.traction === 'diesel' ? 'diesel' : 'electric',
    rake,
    livery: type.livery,
    locoLivery: type.locoLivery,
    isPlayer,
  };
}

/** Owns the Three.js scene and draws the sim state each frame. Never mutates the sim. */
export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.3, 5000);
  cameraMode: CameraMode = 'chase';
  preset: QualityPreset;
  sim!: Sim;

  private world = new THREE.Group();
  private trees = new THREE.Group();
  private train!: TrainModel;
  private signals!: SignalBank;
  private platformLamps: THREE.Points | null = null;
  private readonly aiModels = new Map<string, TrainModel>();
  private readonly sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
  private readonly hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6b5a3a, 0.9);
  private readonly sky = new Sky();
  private readonly rain = new Rain();
  private readonly stars = buildStars();
  private readonly sunDir = new THREE.Vector3();
  private readonly camPos = new THREE.Vector3();
  private readonly camLook = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();
  private chaseYaw = 0;
  private chasePitch = 0.22;
  private chaseDist = 34;
  private cabYaw = 0;
  private cabPitch = 0;
  private sideDist = 25;
  /** Distance behind the train front the side camera looks at (drag slides along the train). */
  private sideAlong = 12;
  private topHeight = 90;
  private snapNext = true;
  private lastFrame = performance.now();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    sim: Sim,
    playerType: TrainType,
    quality: QualityName,
  ) {
    this.preset = PRESETS[quality];
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.preset.antialias,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.sky.scale.setScalar(4500);
    this.scene.add(this.sky, this.hemi, this.sun, this.sun.target, this.rain.lines, this.stars);
    this.scene.add(this.world);
    this.setSim(sim, playerType);
    this.applyPreset(this.preset);
    this.bindMouse();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Build the world for a (new) level: track, stations, signals and trains. */
  setSim(sim: Sim, playerType: TrainType): void {
    this.sim = sim;
    this.disposeWorld();
    const track = sim.track;
    const stations = buildStations(track, sim.setup.route, sim.net);
    this.platformLamps = stations.lamps;
    this.signals = new SignalBank(track, sim.net, sim.setup.route.signals);
    this.trees = buildTrees(track, this.preset);
    this.train = new TrainModel(sim.consist, lookFor(playerType, sim.consist, true));
    this.world.add(
      buildGround(track),
      buildTrack(track, sim.net),
      stations.group,
      buildSpeedBoards(track, sim.setup.route, sim.net),
      this.signals.root,
      this.trees,
      this.train.root,
    );
    this.train.setCabView(this.cameraMode === 'cab');
    this.applyWeather();
    this.snapNext = true;
  }

  applyPreset(preset: QualityPreset): void {
    const treesChanged = preset.trees !== this.preset.trees;
    this.preset = preset;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.maxPixelRatio));
    this.renderer.shadowMap.enabled = preset.shadows;
    this.sun.castShadow = preset.shadows;
    if (preset.shadows) {
      this.sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      const cam = this.sun.shadow.camera;
      cam.left = cam.bottom = -90;
      cam.right = cam.top = 90;
      cam.near = 10;
      cam.far = 500;
      cam.updateProjectionMatrix();
      this.sun.shadow.bias = -0.0005;
    }
    if (treesChanged) {
      this.world.remove(this.trees);
      this.trees = buildTrees(this.sim.track, preset);
      this.world.add(this.trees);
    }
    this.applyWeather();
    // Materials must recompile when shadow support toggles.
    this.scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => (m.needsUpdate = true));
      else if (mat) mat.needsUpdate = true;
    });
  }

  /** Apply the sim's weather to sky, lights, fog and effects. */
  applyWeather(): void {
    const look = WEATHER_LOOKS[this.sim.weatherId];
    const u = this.sky.material.uniforms;
    u['turbidity']!.value = look.turbidity;
    u['rayleigh']!.value = look.rayleigh;
    u['mieCoefficient']!.value = 0.006;
    u['mieDirectionalG']!.value = 0.85;
    const elevation = THREE.MathUtils.degToRad(look.sunElevationDeg);
    this.sunDir.setFromSphericalCoords(1, Math.PI / 2 - elevation, THREE.MathUtils.degToRad(215));
    u['sunPosition']!.value.copy(this.sunDir);
    if (look.sunElevationDeg < 0) this.sunDir.set(-0.3, 0.8, 0.4).normalize(); // moonlight
    this.sun.intensity = look.sunIntensity;
    this.sun.color.setHex(look.sunElevationDeg < 0 ? 0x9fb4ff : 0xffe2b8);
    this.hemi.intensity = look.hemiIntensity;
    const night = look.sunElevationDeg < 0;
    this.hemi.color.setHex(night ? 0x4a5a80 : 0xcfe3ff);
    this.hemi.groundColor.setHex(night ? 0x141a26 : 0x6b5a3a);
    this.renderer.toneMappingExposure = look.exposure;
    const view = this.preset.viewDistanceM;
    const near = look.fogAbsolute ? look.fogNear : look.fogNear * view;
    const far = look.fogAbsolute ? Math.min(look.fogFar, view) : look.fogFar * view;
    this.scene.fog = new THREE.Fog(look.fogColor, near, far);
    this.camera.far = Math.max(far + 300, 800);
    this.camera.updateProjectionMatrix();
    this.sky.visible = look.flatSky === undefined;
    this.scene.background = look.flatSky !== undefined ? new THREE.Color(look.flatSky) : null;
    this.rain.lines.visible = !!look.rain;
    this.stars.visible = !!look.stars;
    if (this.train?.headlight) this.train.headlight.intensity = look.headlight;
    this.signals?.setGlowSize(look.signalGlow);
    if (this.platformLamps) this.platformLamps.visible = !!look.platformLamps;
  }

  setCamera(mode: CameraMode): CameraMode {
    this.cameraMode = mode;
    this.train.setCabView(mode === 'cab');
    this.snapNext = true;
    return mode;
  }

  /** Slow orbit of the chase camera, used behind the start menu. */
  orbit(dtS: number): void {
    this.chaseYaw += dtS * 0.12;
  }

  /** Cycle cab → chase → side → top. */
  cycleCamera(): CameraMode {
    const i = CAMERA_MODES.indexOf(this.cameraMode);
    return this.setCamera(CAMERA_MODES[(i + 1) % CAMERA_MODES.length]!);
  }

  /** Draw the world for the player's train front at chainage `frontS` (already interpolated). */
  render(frontS: number): void {
    const { sim } = this;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const track = sim.track;
    this.train.update(track, frontS, 1, (s) => sim.net.offsetAt(sim.playerLineAt(s), s));
    this.syncAi();
    this.signals.update((def) => sim.aspectOf(def));

    const loco = this.train.locoObject;
    const playerOffset = (s: number) => sim.net.offsetAt(sim.playerLineAt(s), s);
    this.camera.up.copy(UP);
    let smooth = true;
    switch (this.cameraMode) {
      case 'cab': {
        this.train.cab?.update(sim, now / 1000);
        this.train.cabView(this.camPos, this.tmp, this.cabYaw, CAB_BASE_PITCH + this.cabPitch);
        this.camLook.copy(this.camPos).addScaledVector(this.tmp, 50);
        this.camera.fov = 68;
        this.camera.near = 0.08;
        smooth = false;
        break;
      }
      case 'chase': {
        // Orbit behind-left of the loco; mouse drag adjusts yaw/pitch, wheel zooms.
        const back = this.tmp.set(-1, 0, 0).applyQuaternion(loco.quaternion);
        const yaw = Math.atan2(back.z, back.x) + this.chaseYaw - 0.35;
        this.camPos.set(
          loco.position.x + Math.cos(yaw) * Math.cos(this.chasePitch) * this.chaseDist,
          loco.position.y + 2 + Math.sin(this.chasePitch) * this.chaseDist,
          loco.position.z + Math.sin(yaw) * Math.cos(this.chasePitch) * this.chaseDist,
        );
        this.camLook.copy(loco.position).setY(loco.position.y + 2.5);
        this.camera.fov = 55;
        break;
      }
      case 'side': {
        // Lineside, square-on to the train on the right of all lines; pans with it.
        const s = frontS - Math.min(this.sideAlong, sim.consist.lengthM);
        frameAt(track, s, playerOffset(s) + this.sideDist, 3.2, this.camPos);
        frameAt(track, s, playerOffset(s), 2.6, this.camLook);
        this.camera.fov = 50;
        break;
      }
      case 'top': {
        // Straight down, the track heading pointing up the screen.
        const s = frontS - Math.min(sim.consist.lengthM / 2, this.topHeight * 0.35);
        frameAt(track, s, playerOffset(s), this.topHeight, this.camPos);
        frameAt(track, s, playerOffset(s), 0, this.camLook);
        const h = headingAt(track, s);
        this.camera.up.set(Math.cos(h), 0, -Math.sin(h));
        this.camera.fov = 50;
        smooth = false;
        break;
      }
    }
    if (this.cameraMode !== 'cab') this.camera.near = 0.3;
    if (!smooth || this.snapNext || this.camera.position.distanceTo(this.camPos) > 150) {
      this.camera.position.copy(this.camPos);
    } else {
      this.camera.position.lerp(this.camPos, 0.25);
    }
    this.snapNext = false;
    this.camera.lookAt(this.camLook);
    this.sky.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);
    this.rain.update(dt, this.camera);
    this.camera.updateProjectionMatrix();

    // Keep the shadow frustum centred on the loco.
    this.sun.position.copy(loco.position).addScaledVector(this.sunDir, 250);
    this.sun.target.position.copy(loco.position);
    this.renderer.render(this.scene, this.camera);
  }

  stats(): { calls: number; triangles: number } {
    const r = this.renderer.info.render;
    return { calls: r.calls, triangles: r.triangles };
  }

  /** Create, move and remove models for AI trains to match the sim. */
  private syncAi(): void {
    const { sim } = this;
    const alive = new Set<string>();
    for (const t of sim.ai) {
      alive.add(t.id);
      let model = this.aiModels.get(t.id);
      if (!model) {
        model = new TrainModel(t.consist, lookFor(t.type, t.consist, false));
        this.aiModels.set(t.id, model);
        this.world.add(model.root);
      }
      const dir: Dir = t.dir;
      model.update(sim.track, t.frontS, dir, (s) => this.aiOffset(t, s));
    }
    for (const [id, model] of this.aiModels) {
      if (alive.has(id)) continue;
      this.world.remove(model.root);
      model.dispose();
      this.aiModels.delete(id);
    }
  }

  private aiOffset(t: AiTrain, s: number): number {
    return this.sim.net.offsetAt(this.sim.net.lineFor(t.dir, t.loopRoutes, s), s);
  }

  private disposeWorld(): void {
    for (const model of this.aiModels.values()) model.dispose();
    this.aiModels.clear();
    this.world.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      for (const mat of mats) {
        (mat as THREE.MeshStandardMaterial).map?.dispose();
        mat.dispose();
      }
    });
    this.world.clear();
  }

  private bindMouse(): void {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('pointerup', () => (dragging = false));
    const clamp = THREE.MathUtils.clamp;
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      switch (this.cameraMode) {
        case 'chase':
          this.chaseYaw -= dx * 0.005;
          this.chasePitch = clamp(this.chasePitch + dy * 0.004, 0.03, 1.2);
          break;
        case 'cab':
          // Pilot looks around: ±110° left/right, ±35° up/down.
          this.cabYaw = clamp(this.cabYaw + dx * 0.004, -1.92, 1.92);
          this.cabPitch = clamp(this.cabPitch - dy * 0.003, -0.6, 0.6);
          break;
        case 'side':
          this.sideAlong = clamp(this.sideAlong + dx * 0.4, 0, this.sim.consist.lengthM);
          break;
        case 'top':
          break;
      }
    });
    this.canvas.addEventListener('dblclick', () => {
      this.cabYaw = 0;
      this.cabPitch = 0;
    });
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        const k = e.deltaY > 0 ? 1.1 : 0.9;
        if (this.cameraMode === 'chase') this.chaseDist = clamp(this.chaseDist * k, 12, 220);
        else if (this.cameraMode === 'side') this.sideDist = clamp(this.sideDist * k, 10, 120);
        else if (this.cameraMode === 'top') this.topHeight = clamp(this.topHeight * k, 40, 600);
      },
      { passive: true },
    );
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}

export type { WeatherLook };
