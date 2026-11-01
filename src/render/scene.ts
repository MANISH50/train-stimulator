import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { aspectAt } from '../sim/signalling/signal';
import type { Sim } from '../sim/sim';
import { PRESETS, type QualityName, type QualityPreset } from './quality';
import { buildTrack, frameAt, headingAt } from './trackMesh';
import { TrainModel } from './trainModel';
import { SignalModel, buildGround, buildSpeedBoards, buildStations, buildTrees } from './world';

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

/** Owns the Three.js scene and draws the sim state each frame. Never mutates the sim. */
export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.3, 5000);
  cameraMode: CameraMode = 'chase';
  preset: QualityPreset;

  private readonly train: TrainModel;
  private readonly signals: SignalModel[];
  private trees: THREE.Group;
  private readonly sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
  private readonly sky = new Sky();
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

  constructor(
    private readonly canvas: HTMLCanvasElement,
    public sim: Sim,
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
    this.renderer.toneMappingExposure = 0.75;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.buildSky();
    this.scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x6b5a3a, 0.9));
    this.sun.target.position.set(0, 0, 0);
    this.scene.add(this.sun, this.sun.target);

    const track = sim.track;
    this.scene.add(
      buildGround(track),
      buildTrack(track),
      buildStations(track, sim.setup.route),
      buildSpeedBoards(track, sim.setup.route),
    );
    this.trees = buildTrees(track, this.preset);
    this.scene.add(this.trees);
    this.signals = sim.setup.route.signals.map((def) => new SignalModel(track, def));
    for (const s of this.signals) this.scene.add(s.root);
    this.train = new TrainModel(sim.consist);
    this.scene.add(this.train.root);

    this.applyPreset(this.preset);
    this.bindMouse();
    this.resize();
    window.addEventListener('resize', () => this.resize());
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
    this.scene.fog = new THREE.Fog(0xd8c9a8, preset.viewDistanceM * 0.25, preset.viewDistanceM);
    this.camera.far = preset.viewDistanceM + 500;
    this.camera.updateProjectionMatrix();
    if (treesChanged) {
      this.scene.remove(this.trees);
      this.trees = buildTrees(this.sim.track, preset);
      this.scene.add(this.trees);
    }
    // Materials must recompile when shadow support toggles.
    this.scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => (m.needsUpdate = true));
      else if (mat) mat.needsUpdate = true;
    });
  }

  setCamera(mode: CameraMode): CameraMode {
    this.cameraMode = mode;
    this.train.setCabView(mode === 'cab');
    this.snapNext = true;
    return mode;
  }

  /** Cycle cab → chase → side → top. */
  cycleCamera(): CameraMode {
    const i = CAMERA_MODES.indexOf(this.cameraMode);
    return this.setCamera(CAMERA_MODES[(i + 1) % CAMERA_MODES.length]!);
  }

  /** Draw the world for the train front at chainage `frontS` (already interpolated). */
  render(frontS: number): void {
    const { sim } = this;
    this.train.update(sim.track, frontS);
    for (const s of this.signals) s.setAspect(aspectAt(s.def, sim.timeS));
    this.train.headlight.intensity = 0;

    const loco = this.train.locoObject;
    const track = sim.track;
    this.camera.up.copy(UP);
    let smooth = true;
    switch (this.cameraMode) {
      case 'cab': {
        this.train.cab.update(sim, performance.now() / 1000);
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
        // Lineside, square-on to the train on the right of the line; pans with it.
        const along = Math.min(this.sideAlong, sim.consist.lengthM);
        frameAt(track, frontS - along, this.sideDist, 3.2, this.camPos);
        frameAt(track, frontS - along, 0, 2.6, this.camLook);
        this.camera.fov = 50;
        break;
      }
      case 'top': {
        // Straight down, the track heading pointing up the screen.
        const centre = frontS - Math.min(sim.consist.lengthM / 2, this.topHeight * 0.35);
        frameAt(track, centre, 0, this.topHeight, this.camPos);
        frameAt(track, centre, 0, 0, this.camLook);
        const h = headingAt(track, centre);
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

  private buildSky(): void {
    const sky = this.sky;
    sky.scale.setScalar(4500);
    const u = sky.material.uniforms;
    u['turbidity']!.value = 6;
    u['rayleigh']!.value = 1.6;
    u['mieCoefficient']!.value = 0.006;
    u['mieDirectionalG']!.value = 0.85;
    // Late-afternoon sun.
    const elevation = THREE.MathUtils.degToRad(22);
    const azimuth = THREE.MathUtils.degToRad(215);
    this.sunDir.setFromSphericalCoords(1, Math.PI / 2 - elevation, azimuth);
    u['sunPosition']!.value.copy(this.sunDir);
    this.scene.add(sky);
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
