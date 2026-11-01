export type QualityName = 'low' | 'medium' | 'high';

export interface QualityPreset {
  name: QualityName;
  maxPixelRatio: number;
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: number;
  trees: number;
  viewDistanceM: number;
}

export const PRESETS: Record<QualityName, QualityPreset> = {
  low: {
    name: 'low',
    maxPixelRatio: 1,
    antialias: false,
    shadows: false,
    shadowMapSize: 0,
    trees: 600,
    viewDistanceM: 1800,
  },
  medium: {
    name: 'medium',
    maxPixelRatio: 1.25,
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    trees: 1500,
    viewDistanceM: 2600,
  },
  high: {
    name: 'high',
    maxPixelRatio: 2,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    trees: 3000,
    viewDistanceM: 3500,
  },
};

export const QUALITY_ORDER: QualityName[] = ['low', 'medium', 'high'];

/** Rough GPU probe: integrated/software GPUs start on Low or Medium. */
export function detectQuality(): QualityName {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return 'low';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return 'low';
    if (/intel|uhd|iris|adreno|mali|apple m1/i.test(name)) return 'medium';
    if (/nvidia|geforce|rtx|radeon rx|apple m[2-9]/i.test(name)) return 'high';
  } catch {
    return 'low';
  }
  return 'medium';
}
