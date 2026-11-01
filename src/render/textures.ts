// Procedural textures drawn on canvases at load time (original, no external assets).
import * as THREE from 'three';

/** Small deterministic PRNG so the world looks the same every run. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function toTexture(c: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

/** Dry-season field: grass with dusty patches. */
export function groundTexture(repeat: number): THREE.CanvasTexture {
  const [c, g] = canvas(512, 512);
  const rnd = mulberry32(7);
  g.fillStyle = '#7a8a45';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const shade = rnd();
    g.fillStyle =
      shade < 0.5
        ? `rgba(95,115,50,${0.3 + rnd() * 0.4})`
        : `rgba(160,140,90,${0.15 + rnd() * 0.3})`;
    const s = 1 + rnd() * 4;
    g.fillRect(rnd() * 512, rnd() * 512, s, s);
  }
  return toTexture(c, [repeat, repeat]);
}

export function ballastTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const rnd = mulberry32(11);
  g.fillStyle = '#6e6a64';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const v = 80 + Math.floor(rnd() * 90);
    g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
    g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  return toTexture(c, [1, 40]);
}

/** Coach side: window band plus an original two-tone livery. */
/** Livery colours (original schemes); defaults are the Training Ground teal and sand. */
export interface LiveryColours {
  body: string;
  stripe: string;
  roof: string;
}

const DEFAULT_COACH: LiveryColours = { body: '#c9b48a', stripe: '#1f5f5b', roof: '#d4d8da' };
const DEFAULT_LOCO: LiveryColours = { body: '#1f5f5b', stripe: '#e0a63a', roof: '#b9bfc2' };

/** Coach side: window band plus a two-tone livery. */
export function coachSideTexture(l: LiveryColours = DEFAULT_COACH): THREE.CanvasTexture {
  const [c, g] = canvas(1024, 128);
  g.fillStyle = l.body;
  g.fillRect(0, 0, 1024, 128);
  g.fillStyle = l.stripe;
  g.fillRect(0, 84, 1024, 44);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillRect(0, 80, 1024, 4);
  for (let x = 70; x < 960; x += 62) {
    g.fillStyle = '#26323a';
    g.fillRect(x, 30, 44, 34);
    g.fillStyle = 'rgba(180,210,230,0.35)';
    g.fillRect(x + 3, 33, 18, 12);
  }
  g.fillStyle = '#3b3b3b';
  g.fillRect(14, 22, 34, 62);
  g.fillRect(976, 22, 34, 62);
  return toTexture(c);
}

/** EMU car side: wide doors and a band of windows. */
export function emuSideTexture(l: LiveryColours): THREE.CanvasTexture {
  const [c, g] = canvas(1024, 128);
  g.fillStyle = l.body;
  g.fillRect(0, 0, 1024, 128);
  g.fillStyle = l.stripe;
  g.fillRect(0, 92, 1024, 14);
  for (let x = 40; x < 1000; x += 54) {
    g.fillStyle = '#26323a';
    g.fillRect(x, 28, 40, 38);
  }
  g.fillStyle = '#9aa3a8';
  for (const x of [120, 470, 820]) g.fillRect(x, 20, 70, 100);
  return toTexture(c);
}

/** Open goods wagon side with vertical ribs. */
export function wagonSideTexture(l: LiveryColours): THREE.CanvasTexture {
  const [c, g] = canvas(512, 128);
  g.fillStyle = l.body;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = l.stripe;
  for (let x = 16; x < 512; x += 42) g.fillRect(x, 0, 6, 128);
  g.fillRect(0, 0, 512, 8);
  g.fillRect(0, 120, 512, 8);
  return toTexture(c);
}

export function locoSideTexture(
  l: LiveryColours = DEFAULT_LOCO,
  number = 'TG 30001',
): THREE.CanvasTexture {
  const [c, g] = canvas(512, 128);
  g.fillStyle = l.body;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = l.stripe;
  g.fillRect(0, 70, 512, 12);
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillRect(0, 86, 512, 4);
  for (let x = 120; x < 400; x += 40) {
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(x, 20, 28, 38);
  }
  g.fillStyle = '#26323a';
  g.fillRect(16, 18, 60, 40);
  g.fillRect(436, 18, 60, 40);
  g.fillStyle = '#f2ead3';
  g.font = 'bold 22px sans-serif';
  g.fillText(number, 210, 112);
  return toTexture(c);
}

/** Station name board: English + Devanagari on yellow, as on many Indian stations (generic style). */
export function stationBoardTexture(english: string, hindi: string): THREE.CanvasTexture {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = '#f2c230';
  g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = '#1a1a1a';
  g.lineWidth = 10;
  g.strokeRect(5, 5, 1014, 246);
  g.fillStyle = '#111';
  g.textAlign = 'center';
  g.font = "bold 86px 'Nirmala UI', 'Noto Sans Devanagari', 'Mangal', sans-serif";
  g.fillText(hindi, 512, 110);
  g.font = 'bold 78px sans-serif';
  g.fillText(english.toUpperCase(), 512, 215);
  return toTexture(c);
}

/** Lineside board, e.g. a speed figure or termination mark. */
export function boardTexture(text: string, bg: string, fg: string): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = fg;
  g.lineWidth = 8;
  g.strokeRect(4, 4, 120, 120);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${text.length > 2 ? 44 : 64}px sans-serif`;
  g.fillText(text, 64, 68);
  return toTexture(c);
}

/** Soft radial glow sprite used for signal lamps and headlights. */
export function glowTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(64, 64);
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return toTexture(c);
}
